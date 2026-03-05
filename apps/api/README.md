# With-NestJs | API

## Getting Started

First, run the development server:

```bash
npm run dev
```

By default, your server will run at [http://localhost:3000](http://localhost:3000). You can use your favorite API platform like [Insomnia](https://insomnia.rest/) or [Postman](https://www.postman.com/) to test your APIs

You can start editing the demo **APIs** by modifying [linksService](./src/links/links.service.ts) provider.

### ⚠️ Note about build

If you plan to only build this app. Please make sure you've built the packages first.

## Learn More

To learn more about NestJs, take a look at the following resources:

- [Official Documentation](https://docs.nestjs.com) - A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- [Official NestJS Courses](https://courses.nestjs.com) - Learn everything you need to master NestJS and tackle modern backend applications at any scale.
- [GitHub Repo](https://github.com/nestjs/nest)

## Force API Deployment (No TS Changes)

Production CI only deploys when `make check-api-changes` finds meaningful API changes.
If you need to trigger deployment without touching TypeScript code:

```bash
sed -i '' "s/^force-deploy: .*/force-deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)/" apps/api/src/.deploy-trigger
```

Then commit and push the change.
