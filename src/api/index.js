export function getServerHost() {
  const hostName = window.location.hostname
  if (hostName.includes('dev')) {
    return hostName.replace('dev', 'ws')
  }
  return (process.env.NODE_ENV === 'development' ||
    hostName.includes('192.168.1.') ||
    hostName.includes('172.20.10.') ||
    hostName.includes('localhost'))
    ? 'ws.pinme.io'
    : 'ws.' + hostName
}
