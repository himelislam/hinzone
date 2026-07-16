import { EventEmitter } from 'node:events';
import type { TransactionCategory } from 'shared-types';

// tasks/phase-04.md - Wallet Events. An in-process event bus WalletService
// publishes to on every credit/debit/lock/unlock - a documented integration
// point a future NotificationService, queue worker, or WebSocket gateway can
// subscribe to without WalletService knowing anything about them
// (backend_rules.md #25/#30 - design for future Redis/BullMQ/WebSockets without
// tight coupling).
export interface WalletBalanceChangedPayload {
  walletId: string;
  userId: string;
  amount: number;
  category: TransactionCategory;
  transactionId: string;
}

export interface WalletStatusChangedPayload {
  walletId: string;
  userId: string;
}

interface WalletEventMap {
  WalletCredited: (payload: WalletBalanceChangedPayload) => void;
  WalletDebited: (payload: WalletBalanceChangedPayload) => void;
  WalletLocked: (payload: WalletStatusChangedPayload) => void;
  WalletUnlocked: (payload: WalletStatusChangedPayload) => void;
}

class WalletEventEmitter extends EventEmitter {
  emit<E extends keyof WalletEventMap>(event: E, ...args: Parameters<WalletEventMap[E]>): boolean {
    return super.emit(event, ...args);
  }

  on<E extends keyof WalletEventMap>(event: E, listener: WalletEventMap[E]): this {
    return super.on(event, listener);
  }
}

export const walletEvents = new WalletEventEmitter();
