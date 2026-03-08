import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from './event-bus.service';

// Mock ioredis
const mockPublish = jest.fn().mockResolvedValue(1);
const mockSubscribe = jest.fn().mockResolvedValue(undefined);
const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn();
const messageHandlers = new Map<string, Function>();

jest.mock('ioredis', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      publish: mockPublish,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      connect: mockConnect,
      disconnect: mockDisconnect,
      on: jest.fn((event: string, handler: Function) => {
        messageHandlers.set(event, handler);
      }),
    })),
  };
});

describe('EventBusService', () => {
  let service: EventBusService;

  beforeEach(async () => {
    jest.clearAllMocks();
    messageHandlers.clear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventBusService,
        {
          provide: ConfigService,
          useValue: { get: () => 'redis://localhost:6379' },
        },
      ],
    }).compile();

    service = module.get<EventBusService>(EventBusService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should emit events via Redis publish', () => {
    service.emit('test.event', { foo: 'bar' });
    expect(mockPublish).toHaveBeenCalledWith(
      'qubilt:events',
      expect.stringContaining('"event":"test.event"'),
    );
  });

  it('should dispatch to registered handlers on message', () => {
    const handler = jest.fn();
    service.on('test.event', handler);

    // Simulate receiving a Redis message
    const messageHandler = messageHandlers.get('message');
    expect(messageHandler).toBeDefined();

    messageHandler!(
      'qubilt:events',
      JSON.stringify({
        event: 'test.event',
        payload: { data: 123 },
        timestamp: Date.now(),
      }),
    );

    expect(handler).toHaveBeenCalledWith({ data: 123 });
  });

  it('should not call handler for unrelated events', () => {
    const handler = jest.fn();
    service.on('other.event', handler);

    const messageHandler = messageHandlers.get('message');
    messageHandler!(
      'qubilt:events',
      JSON.stringify({
        event: 'test.event',
        payload: {},
        timestamp: Date.now(),
      }),
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('should call onAny handlers for every event', () => {
    const anyHandler = jest.fn();
    service.onAny(anyHandler);

    const messageHandler = messageHandlers.get('message');
    messageHandler!(
      'qubilt:events',
      JSON.stringify({
        event: 'some.event',
        payload: { x: 1 },
        timestamp: Date.now(),
      }),
    );

    expect(anyHandler).toHaveBeenCalledWith('some.event', { x: 1 });
  });

  it('should remove handler with off()', () => {
    const handler = jest.fn();
    service.on('test.event', handler);
    service.off('test.event', handler);

    const messageHandler = messageHandlers.get('message');
    messageHandler!(
      'qubilt:events',
      JSON.stringify({
        event: 'test.event',
        payload: {},
        timestamp: Date.now(),
      }),
    );

    expect(handler).not.toHaveBeenCalled();
  });
});
