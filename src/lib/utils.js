export const formatNumber = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const isIOSSafari = () => {
  const ua = window.navigator.userAgent
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i)
  const webkit = !!ua.match(/WebKit/i)
  return iOS && webkit && !ua.match(/CriOS/i)
}

export const isCrappyIE = () => {
  return !!(
    typeof window !== "undefined" &&
    window.navigator.msSaveOrOpenBlob &&
    window.Blob
  )
}

function padCalNum(num) {
  if (num < 10) return `0${num}`
  return `${num}`
}

export const formatDate = (dateString) => {
  const dateTime = new Date(dateString)
  return [
    dateTime.getUTCFullYear(),
    padCalNum(dateTime.getUTCMonth() + 1),
    padCalNum(dateTime.getUTCDate()),
    "T",
    padCalNum(dateTime.getUTCHours()),
    padCalNum(dateTime.getUTCMinutes()) + "00Z"
  ].join("")
}

export const buildUrl = (event, useDataURL, rawContent) => {
  const body = []
  if (!event || !event.startTime || !event.title)
    throw Error("Both startTime and title fields are mandatory")

  body.push(`DTSTART:${formatDate(event.startTime)}`)
  body.push(`SUMMARY:${event.title}`)

  event.url && body.push(`URL:${event.url}`)
  event.attendees &&
    event.attendees.forEach(attendee => {
      const regExp = /^([^<]+)\s*<(.+)>/
      const matches = attendee.match(regExp)
      if (matches) {
        const name = matches[1]
        const email = matches[2]
        body.push(
          [
            "ATTENDEE",
            `CN=${name}`,
            "CUTYPE=INDIVIDUAL",
            "PARTSTAT=NEEDS-ACTION",
            "ROLE=REQ-PARTICIPANT",
            `RSVP=TRUE:mailto:${email}`
          ].join("")
        )
      }
    })
  event.endTime && body.push(`DTEND:${formatDate(event.endTime)}`)
  event.description && body.push(`DESCRIPTION:${event.description}`)
  event.location && body.push(`LOCATION:${event.location}`)
  rawContent && body.push(rawContent)

  const url = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    body.join("\n"),
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n")

  if (useDataURL) return encodeURI(`data:text/calendarcharset=utf8,${url}`)
  return url
}

export function downloadBlob(blob, filename) {
  const linkEl = document.createElement("a")
  linkEl.href = window.URL.createObjectURL(blob)
  linkEl.setAttribute("download", filename)
  document.body.appendChild(linkEl)
  linkEl.click()
  document.body.removeChild(linkEl)
}

/*
{
  title: "--- TITLE ---",
  description:
    ">>> DESCRIPTION <<<\\n Today is a huge day. \\n Tomorrow will be a huge day too!\\n",
  startTime: "2021-05-09T10:30:00+10:00",
  endTime: "2021-05-09T12:00:00+10:00",
  location: "10 Carlotta St Artarmon NSW 2064",
  attendees: [
    "Hello World<hello@world.com>",
    "Hey <hey@test.com>"
  ],
}
*/
export const addToCalendar = (eventData, rawContent = '') => {
  const filename = eventData.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').concat('.ics')
  const url = buildUrl(eventData, isIOSSafari(), rawContent)
  const blob = new Blob([url], {
    type: "text/calendarcharset=utf-8"
  })

  // IE
  if (isCrappyIE()) {
    window.navigator.msSaveOrOpenBlob(blob, filename)
    return
  }

  // Safari
  if (isIOSSafari()) {
    window.open(url, "_blank")
    return
  }

  // Desktop
  downloadBlob(blob, filename)
}