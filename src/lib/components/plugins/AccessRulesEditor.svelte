<script>
  import { untrack } from 'svelte'
  import { pb } from '$lib/pocketbase'
  import { ACCESS_RULE_TYPES, FACTION_OPTIONS } from '$lib/plugins'

  // Edits a plugin's access JSON ({ rules: [...] }), the same rule shape the
  // email campaign targeting uses. Rules are OR'd; the author always has
  // access, so an empty list means "only me".
  let { access = $bindable({ rules: [] }) } = $props()

  // Local {#each} keys, not crypto.randomUUID(): that only exists in secure
  // contexts and the dev server is often opened over plain http on a phone.
  let ruleIdCounter = 0
  const nextRuleId = () => `rule-${++ruleIdCounter}`

  const toEditorRule = (rule) => ({
    id: nextRuleId(),
    type: rule.type,
    factions: rule.factions || [],
    users: (rule.userIds || []).map(id => ({ id, username: '…' })),
    searchQuery: '',
    searchResults: [],
    searching: false
  })

  let rules = $state(untrack(() => (access?.rules || []).map(toEditorRule)))
  let addRuleType = $state('all')

  // Saved rules only hold user ids; look the names up once for the chips.
  $effect(() => {
    for (const rule of untrack(() => rules)) {
      for (const user of rule.users) {
        pb.collection('public_users').getOne(user.id, { requestKey: null })
          .then(record => { user.username = record.username })
          .catch(() => { user.username = 'unknown agent' })
      }
    }
  })

  // Only the fields the backend reads; search state stays local.
  const sync = () => {
    access = {
      rules: rules.map(r => {
        if (r.type === 'faction') return { type: 'faction', factions: r.factions }
        if (r.type === 'user') return { type: 'user', userIds: r.users.map(u => u.id) }
        return { type: r.type }
      })
    }
  }

  const addRule = () => {
    rules.push(toEditorRule({ type: addRuleType }))
    sync()
  }

  const removeRule = (id) => {
    rules = rules.filter(r => r.id !== id)
    sync()
  }

  const toggleFaction = (rule, value) => {
    rule.factions = rule.factions.includes(value)
      ? rule.factions.filter(f => f !== value)
      : [...rule.factions, value]
    sync()
  }

  const searchUsers = async (rule) => {
    const q = rule.searchQuery.trim()
    if (!q) return
    rule.searching = true
    try {
      const result = await pb.collection('public_users').getList(1, 10, {
        filter: pb.filter('username ~ {:q}', { q }),
        requestKey: null
      })
      rule.searchResults = result.items
    } catch (err) {
      console.error(err)
    } finally {
      rule.searching = false
    }
  }

  const addUser = (rule, user) => {
    if (!rule.users.some(u => u.id === user.id)) rule.users.push({ id: user.id, username: user.username })
    rule.searchResults = []
    rule.searchQuery = ''
    sync()
  }

  const removeUser = (rule, id) => {
    rule.users = rule.users.filter(u => u.id !== id)
    sync()
  }
</script>

<div class="access">
  {#if rules.length === 0}
    <p class="hint">No rules yet: only you can see and load this plugin.</p>
  {/if}

  {#each rules as rule (rule.id)}
    <div class="rule-card">
      <div class="rule-card-header">
        <strong>{ACCESS_RULE_TYPES.find(o => o.value === rule.type)?.label}</strong>
        <button type="button" class="remove-rule" onclick={() => removeRule(rule.id)}>Remove</button>
      </div>

      {#if rule.type === 'faction'}
        <div class="faction-options">
          {#each FACTION_OPTIONS as opt (opt.value)}
            <label class="checkbox-label">
              <input type="checkbox" checked={rule.factions.includes(opt.value)} onchange={() => toggleFaction(rule, opt.value)} />
              {opt.label}
            </label>
          {/each}
        </div>
        <p class="hint">Only counts for verified agents, since unverified agents can change their faction at will.</p>
      {:else if rule.type === 'user'}
        {#if rule.users.length > 0}
          <div class="chips">
            {#each rule.users as u (u.id)}
              <span class="chip">
                {u.username}
                <button type="button" aria-label="Remove {u.username}" onclick={() => removeUser(rule, u.id)}>&times;</button>
              </span>
            {/each}
          </div>
        {/if}
        <form class="search-row" onsubmit={(e) => { e.preventDefault(); searchUsers(rule) }}>
          <input type="text" bind:value={rule.searchQuery} placeholder="Search by agent name…" />
          <button type="submit" class="cta" disabled={rule.searching || !rule.searchQuery.trim()}>
            {rule.searching ? 'Searching…' : 'Search'}
          </button>
        </form>
        {#if rule.searchResults.length > 0}
          <ul class="results">
            {#each rule.searchResults as u (u.id)}
              <li>
                <strong>{u.username}</strong>
                <button type="button" class="cta" onclick={() => addUser(rule, u)}>Add</button>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </div>
  {/each}

  <div class="add-rule-row">
    <select bind:value={addRuleType} aria-label="Rule type">
      {#each ACCESS_RULE_TYPES as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    <button type="button" class="cta" onclick={addRule}>+ Add rule</button>
  </div>
</div>

<style>
  div.access {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
    text-align: left;
  }
  p.hint {
    margin: 0;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  div.rule-card {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.75em;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
  }
  div.rule-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  button.remove-rule {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.85em;
  }
  button.remove-rule:hover {
    color: #fff;
  }
  div.faction-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75em;
  }
  label.checkbox-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.4em;
  }
  label.checkbox-label input {
    width: auto;
  }
  div.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
  }
  span.chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    background: rgba(94, 90, 117, 0.4);
    border-radius: 999px;
    padding: 0.2em 0.7em;
    font-size: 0.85em;
  }
  span.chip button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    font-size: 1em;
    line-height: 1;
  }
  form.search-row,
  div.add-rule-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75em;
  }
  form.search-row input,
  div.add-rule-row select {
    flex: 1;
    width: auto;
    min-width: 0;
  }
  ul.results {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  ul.results li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75em;
    padding: 0.4em 0.6em;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
  button.cta {
    white-space: nowrap;
  }
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
