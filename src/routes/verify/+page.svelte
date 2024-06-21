<script>
      import { authData } from '$lib/stores'

    let verification = '';
     $: {
       verification = $authData?.baseModel?.verification || '';
       if (verification === '') {
        verification = 'none';
      }
    }

</script>

<p><img src="/images/verification/verified.svg"/>Your Verification level is "<b>{verification.toUpperCase()}</b>"</p>

<style>
p {
    text-align: center;
    margin-left: 5%;
    margin-right: 5%;
  }
  .center {
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  img {
      height: 1em;
      vertical-align: sub;
      margin: 0 0.25em;
  }

</style>
