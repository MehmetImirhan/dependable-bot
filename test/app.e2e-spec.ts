import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { OutdatedDependency } from '../src/remote/remote.types';
import { AllExceptionsFilter } from '../src/all-exceptions.filter';
import { Logger } from 'nestjs-pino';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));
    app.useLogger(app.get(Logger));
    await app.init();
  });

  // TODO: investigate configuration options
  // redis connection is not handled properly so we get `Connection is closed` error when we try to close the app.
  // afterEach(async () => {
  //   await app.close();
  // });

  it(`/subscriptions/:subscriptionId/outdated-dependencies (GET) - invalid subscription id`, () => {
    return request(app.getHttpServer())
      .get(`/subscriptions/dummy-id/outdated-dependencies`)
      .expect(400);
  });

  it('/subscriptions (POST) - invalid repositoryUrl', () => {
    return request(app.getHttpServer())
      .post('/subscriptions')
      .send({
        repositoryUrl: 'invalid-url',
        emails: ['oguzcanyavuz321@gmail.com', 'random@example.com'],
      })
      .expect(400);
  });

  it('/subscriptions (POST) - invalid emails', () => {
    return request(app.getHttpServer())
      .post('/subscriptions')
      .send({
        repositoryUrl:
          'https://github.com/oguzcan-yavuz/nestjs-task-management',
        emails: ['oguzcanyavuz321@gmail.com', 'invalid-email'],
      })
      .expect(400);
  });

  describe('Github repositories', () => {
    describe('npmOrYarn', () => {
      let subscriptionId: string;

      it('/subscriptions (POST) - success', () => {
        return request(app.getHttpServer())
          .post('/subscriptions')
          .send({
            repositoryUrl:
              'https://github.com/oguzcan-yavuz/nestjs-task-management',
            emails: ['oguzcanyavuz321@gmail.com', 'random@example.com'],
          })
          .expect(201)
          .then(response => {
            expect(response.body).toHaveProperty('id');
            subscriptionId = response.body.id;
          });
      });

      it(`/subscriptions/:subscriptionId/outdated-dependencies (GET) - success`, () => {
        return request(app.getHttpServer())
          .get(`/subscriptions/${subscriptionId}/outdated-dependencies`)
          .expect(200)
          .then(response => {
            expect(response.body).toBeInstanceOf(Array);

            const outdatedDependencies = response.body as OutdatedDependency[];

            outdatedDependencies.forEach(dependency => {
              expect(dependency).toEqual(
                expect.objectContaining({
                  name: expect.any(String),
                  version: expect.any(String),
                  latestVersion: expect.any(String),
                }),
              );
            });
          });
      });
    });

    describe('composer', () => {
      let subscriptionId: string;
      it('/subscriptions (POST) - success', () => {
        return request(app.getHttpServer())
          .post('/subscriptions')
          .send({
            repositoryUrl: 'https://github.com/symfony/symfony',
            emails: ['oguzcanyavuz321@gmail.com', 'random@example.com'],
          })
          .expect(201)
          .then(response => {
            expect(response.body).toHaveProperty('id');
            subscriptionId = response.body.id;
          });
      });

      it(`/subscriptions/:subscriptionId/outdated-dependencies (GET) - success`, () => {
        return request(app.getHttpServer())
          .get(`/subscriptions/${subscriptionId}/outdated-dependencies`)
          .expect(200)
          .then(response => {
            expect(response.body).toBeInstanceOf(Array);

            const outdatedDependencies = response.body as OutdatedDependency[];

            outdatedDependencies.forEach(dependency => {
              expect(dependency).toEqual(
                expect.objectContaining({
                  name: expect.any(String),
                  version: expect.any(String),
                  latestVersion: expect.any(String),
                }),
              );
            });
          });
      });
    });
  });

  describe('Gitlab repositories', () => {
    describe('npmOrYarn', () => {
      let subscriptionId: string;

      it('/subscriptions (POST) - success', () => {
        return request(app.getHttpServer())
          .post('/subscriptions')
          .send({
            repositoryUrl: 'https://gitlab.com/watched/tensorflow/tensorflow',
            emails: ['oguzcanyavuz321@gmail.com', 'random@example.com'],
          })
          .expect(201)
          .then(response => {
            expect(response.body).toHaveProperty('id');
            subscriptionId = response.body.id;
          });
      });

      it(`/subscriptions/:subscriptionId/outdated-dependencies (GET) - success`, () => {
        return request(app.getHttpServer())
          .get(`/subscriptions/${subscriptionId}/outdated-dependencies`)
          .expect(500)
          .then(response => {
            expect(response.body).toEqual(
              expect.objectContaining({
                message: 'Method not implemented.',
              }),
            );
          });
      });
    });
  });
});
