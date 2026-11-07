import "server-only";
import type { AgentInputItem, Session } from "@openai/agents";
import prisma from "@/lib/db";

const DEFAULT_WINDOW = 20;

function isChatMessage(item: AgentInputItem) {
  return "role" in item && (item.role === "user" || item.role === "assistant");
}

function toStorable(item: AgentInputItem) {
  const clean = JSON.parse(JSON.stringify(item));
  delete clean.id;
  return clean;
}

export class PrismaSession implements Session {
  constructor(private readonly userId: string) {}

  async getSessionId() {
    return this.userId;
  }

  async getItems(limit?: number): Promise<AgentInputItem[]> {
    const rows = await prisma.aiMessage.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: "desc" },
      take: limit ?? DEFAULT_WINDOW,
      select: { item: true },
    });

    await this.trim();

    return rows.reverse().map((r) => r.item as unknown as AgentInputItem);
  }

  async addItems(items: AgentInputItem[]) {
    const messages = items.filter(isChatMessage);
    if (messages.length === 0) return;

    const base = Date.now();
    await prisma.aiMessage.createMany({
      data: messages.map((item, i) => ({
        userId: this.userId,
        item: toStorable(item),
        createdAt: new Date(base + i),
      })),
    });
  }

  async popItem() {
    const last = await prisma.aiMessage.findFirst({
      where: { userId: this.userId },
      orderBy: { createdAt: "desc" },
    });
    if (!last) return undefined;
    await prisma.aiMessage.delete({ where: { id: last.id } });
    return last.item as unknown as AgentInputItem;
  }

  private async trim() {
    const [newestExcess] = await prisma.aiMessage.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: "desc" },
      skip: 40,
      take: 1,
      select: { createdAt: true },
    });
    if (!newestExcess) return;

    await prisma.aiMessage.deleteMany({
      where: {
        userId: this.userId,
        createdAt: { lte: newestExcess.createdAt },
      },
    });
  }

  async clearSession() {
    await prisma.aiMessage.deleteMany({ where: { userId: this.userId } });
  }
}
