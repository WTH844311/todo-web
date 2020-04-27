const firstRoute = ''
const shareLink_prefix = "http://localhost/todo/#/"
const domain = `http://localhost:3000/`
const serverDomain = `http://localhost:3001/`
const wsDomain = `ws://localhost:3002/`

const jwt = {
    exp: 60 * 60,
    secretKey: 'your_secretKey',
}

const version = 'v1.0.1'
export {
    firstRoute,
    shareLink_prefix,
    domain,
    serverDomain,
    wsDomain,
    version,
    jwt
}
