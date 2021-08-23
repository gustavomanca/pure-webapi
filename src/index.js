const http = require('http')
const PORT = 5000
const DEFAULT_HEADER = { 'Content-Type': 'application/json' }

const HeroFactory = require('./factories/heroFactory')
const heroService = HeroFactory.generateInstance()
const Hero = require('./entities/hero')

const routes = {
  '/heroes:get': async (request, response) => {
    const { id } = request.queryString
    const heroes = await heroService.find(id)

    response.write(JSON.stringify({ results: heroes }))
    return response.end()
  },

  '/heroes:post': async (request, response) => {
    // async iterator
    for await (const data of request) {
      try {
        // await Promise.reject('/heroes:post')
        const item = JSON.parse(data)
        const hero = new Hero(item)
        const { error, valid } = hero.isValid()
        if (!valid) {
          response.writeHead(400, DEFAULT_HEADER)
          response.write(JSON.stringify({ error: error.join(',') }))
          return response.end()
        }

        const id = await heroService.create(hero)
        response.writeHead(201, DEFAULT_HEADER)
        response.write(
          JSON.stringify({ success: 'User created successfully', id })
        )

        // We only use return as we know that is just one body object by request
        // If was a file, which uploads on demand, it could be run more than once in same event, then we should remove return
        return response.end()
      } catch (error) {
        return handleError(response)(error)
      }
    }
  },

  default: (_, response) => {
    response.write('Hello!')
    response.end()
  }
}

const handleError = (response) => {
  return (error) => {
    console.error('Oops, something got bad!', error)
    response.writeHead(500, DEFAULT_HEADER)
    response.write(JSON.stringify({ error: 'Internal Server Error!!!' }))
    response.end()
  }
}

const handler = (request, response) => {
  const { url, method } = request
  const [first, route, id] = url.split('/')

  request.queryString = { id: isNaN(id) ? id : Number(id) }

  const key = `/${route}:${method.toLowerCase()}`

  response.writeHead(200, DEFAULT_HEADER)

  const chosen = routes[key] || routes.default
  return chosen(request, response).catch(handleError(response))
}

http
  .createServer(handler)
  .listen(PORT, () => console.log(`Server is running at port: ${PORT}`))
