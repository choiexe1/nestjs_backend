import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, CallHandler } from "@nestjs/common";
import { of } from "rxjs";
import { ResponseTransformInterceptor } from "../src/core/interceptors/response-transform.interceptor";

describe("ResponseTransformInterceptor", () => {
  let interceptor: ResponseTransformInterceptor<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseTransformInterceptor],
    }).compile();

    interceptor = module.get<ResponseTransformInterceptor<any>>(
      ResponseTransformInterceptor,
    );
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  it("should transform response for GET request", (done) => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "GET",
          url: "/test",
        }),
        getResponse: () => ({
          statusCode: 200,
        }),
      }),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({ id: 1, name: "test" }),
    } as CallHandler;

    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: { id: 1, name: "test" },
          message: "조회되었습니다.",
          timestamp: expect.any(String),
          path: "/test",
        });
        done();
      });
  });

  it("should transform response for POST request", (done) => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "POST",
          url: "/test",
        }),
        getResponse: () => ({
          statusCode: 201,
        }),
      }),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({ id: 1, name: "created" }),
    } as CallHandler;

    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: { id: 1, name: "created" },
          message: "생성되었습니다.",
          timestamp: expect.any(String),
          path: "/test",
        });
        done();
      });
  });

  it("should transform response for PUT request", (done) => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "PUT",
          url: "/test/1",
        }),
        getResponse: () => ({
          statusCode: 200,
        }),
      }),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({ id: 1, name: "updated" }),
    } as CallHandler;

    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: { id: 1, name: "updated" },
          message: "수정되었습니다.",
          timestamp: expect.any(String),
          path: "/test/1",
        });
        done();
      });
  });

  it("should transform response for DELETE request", (done) => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "DELETE",
          url: "/test/1",
        }),
        getResponse: () => ({
          statusCode: 204,
        }),
      }),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () => of(undefined),
    } as CallHandler;

    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: undefined,
          message: "삭제되었습니다.",
          timestamp: expect.any(String),
          path: "/test/1",
        });
        done();
      });
  });
});
