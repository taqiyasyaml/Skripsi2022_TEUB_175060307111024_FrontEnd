export default window.WS_URL || (window.location.protocol == 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/'