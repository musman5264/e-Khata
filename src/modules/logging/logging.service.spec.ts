import { Test, TestingModule } from '@nestjs/testing';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingService],
    }).compile();

    service = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log a message', () => {
    const logSpy = jest.spyOn(service, 'log');
    service.log('Test message', 'TestContext');
    expect(logSpy).toHaveBeenCalledWith('Test message', 'TestContext');
  });

  it('should log an error', () => {
    const errorSpy = jest.spyOn(service, 'error');
    service.error('Test error', 'stack trace', 'TestContext');
    expect(errorSpy).toHaveBeenCalledWith('Test error', 'stack trace', 'TestContext');
  });
});
