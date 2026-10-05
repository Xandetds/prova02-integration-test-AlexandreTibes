import pactum from 'pactum';
import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import { SimpleReporter } from '../simple-reporter';

describe('Platzi Fake Store API', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://api.escuelajs.co/api/v1';
  const product = {
    title: `Produto ${faker.commerce.productName()}`,
    price: faker.number.int({ min: 10, max: 500 }),
    description: faker.commerce.productDescription(),
    categoryId: 1,
    images: ['https://placehold.co/600x400']
  };
  const updatedProduct = {
    ...product,
    title: `${product.title} atualizado`,
    price: 999
  };

  jest.setTimeout(60000);
  p.request.setDefaultTimeout(60000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  describe('Products', () => {
    it('POST/products: deve  criar um produto válido e retornar 201 com os dados enviados', async () => {
      await p
        .spec()
        .post(`${baseUrl}/products`)
        .withJson(product)
        .expectStatus(StatusCodes.CREATED)
        .expectJsonLike({ title: product.title, price: product.price })
        .stores('productId', 'id');
    });

    it('GET/products/:id: deve rretornar o produto criado com o formato esperado', async () => {
      await p
        .spec()
        .get(`${baseUrl}/products/$S{productId}`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: '$S{productId}',
          title: product.title,
          price: product.price
        })
        .expectJsonSchema({
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            price: { type: 'number' },
            description: { type: 'string' },
            category: { type: 'object' },
            images: { type: 'array' }
          },
          required: [
            'id',
            'title',
            'price',
            'description',
            'category',
            'images'
          ]
        });
    });

    it('GET/products: deve listr 5 produtos ao usar offset e limit', async () => {
      await p
        .spec()
        .get(`${baseUrl}/products`)
        .withQueryParams({ offset: 0, limit: 5 })
        .expectStatus(StatusCodes.OK)
        .expectJsonLength(5);
    });

    it('PUT/products/:id: deve atualizar o título e preço e retorna 200 com os novos valores', async () => {
      await p
        .spec()
        .put(`${baseUrl}/products/$S{productId}`)
        .withJson(updatedProduct)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: '$S{productId}',
          title: updatedProduct.title,
          price: updatedProduct.price
        });
    });

    it('GET/products/:id: deve confirmar que a atualização realmente ocorreu', async () => {
      await p
        .spec()
        .get(`${baseUrl}/products/$S{productId}`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          title: updatedProduct.title,
          price: updatedProduct.price
        });
    });

    it('DELETE/products/:id: apaga o produto e retorna 200 com true', async () => {
      await p
        .spec()
        .delete(`${baseUrl}/products/$S{productId}`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('true');
    });

    it('GET/products/:id: não encontra mais o produto após o deletar', async () => {
      await p
        .spec()
        .get(`${baseUrl}/products/$S{productId}`)
        .expect(({ res }) => {
          expect([StatusCodes.BAD_REQUEST, StatusCodes.NOT_FOUND]).toContain(
            res.statusCode
          );
        });
    });
  });
});
