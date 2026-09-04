import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject, interval, takeUntil } from 'rxjs';
import { imageUrl } from '../../core/api';
import { ChatMessage, Conversation } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatListModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class ChatPage implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  readonly conversations = signal<Conversation[]>([]);
  readonly messages = signal<ChatMessage[]>([]);
  readonly activePeerId = signal<number | null>(null);
  readonly draft = signal('');
  readonly sending = signal(false);

  readonly img = imageUrl;
  readonly myUserId = this.auth.currentUser()?.id ?? 0;

  private messagesScroll = viewChild<ElementRef<HTMLElement>>('messagesScroll');

  constructor() {
    effect(() => {
      this.messages();
      queueMicrotask(() => this.scrollToBottom());
    });
  }

  ngOnInit(): void {
    const peer = Number(this.route.snapshot.queryParamMap.get('peer'));
    this.loadConversations();

    if (peer && peer !== this.myUserId) {
      this.openConversation(peer);
    }

    interval(10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadConversations();
        if (this.activePeerId()) {
          this.loadMessages(this.activePeerId()!);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openConversation(peerId: number): void {
    this.activePeerId.set(peerId);
    this.loadMessages(peerId);
  }

  backToList(): void {
    this.activePeerId.set(null);
    this.loadConversations();
  }

  send(): void {
    const content = this.draft().trim();
    const peerId = this.activePeerId();
    if (!content || !peerId || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.chatService
      .send(peerId, content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.draft.set('');
          this.sending.set(false);
          this.loadMessages(peerId);
          this.loadConversations();
        },
        error: () => {
          this.sending.set(false);
          this.snackBar.open('发送失败，请稍后再试', '知道了', { duration: 2000 });
        },
      });
  }

  avatarFor(isSelf: boolean): string {
    if (isSelf) {
      return this.img(this.auth.currentUser()?.avatar) || '/avatar-default.svg';
    }
    const peerId = this.activePeerId();
    const conv = this.conversations().find((c) => c.user_id === peerId);
    return (conv && this.img(conv.avatar)) || '/avatar-default.svg';
  }

  peerName(peerId: number): string {
    const conv = this.conversations().find((c) => c.user_id === peerId);
    return conv?.nickname || `用户 ${peerId}`;
  }

  private loadConversations(): void {
    this.chatService
      .conversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => this.conversations.set(list));
  }

  private loadMessages(peerId: number): void {
    this.chatService
      .history(peerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => this.messages.set(list));
  }

  private scrollToBottom(): void {
    const el = this.messagesScroll()?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
