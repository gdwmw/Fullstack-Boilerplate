import swagger from "@elysiajs/swagger";

export const swaggerPlugin = swagger({
  documentation: {
    components: {
      securitySchemes: {
        bearerAuth: {
          bearerFormat: "JWT",
          scheme: "bearer",
          type: "http",
        },
      },
    },
    info: {
      description: "REST API built with ElysiaJS, Prisma, and JWT Authentication",
      title: "Elysia.js Boilerplate",
      version: "1.0.0",
    },
  },
});
