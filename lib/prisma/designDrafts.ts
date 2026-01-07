import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type DesignDraftInput = {
  productId?: string;
  variantId?: string;
  printSpecId: string;
  dpi?: number;
  cornerStyle?: 'square' | 'rounded';
  cornerRadiusMm?: number;
  designJsonBySide: {
    front: string | null;
    back: string | null;
  };
  previewPngBySide: {
    front: string | null;
    back: string | null;
  };
  sessionId?: string;
  userId?: string;
};

export async function createDesignDraft(input: DesignDraftInput) {
  return prisma.designDraft.create({
    data: {
      productId: input.productId || null,
      variantId: input.variantId || null,
      printSpecId: input.printSpecId,
      dpi: input.dpi || 300,
      cornerStyle: input.cornerStyle || 'square',
      cornerRadiusMm: input.cornerRadiusMm || 0,
      designJsonFront: input.designJsonBySide.front,
      designJsonBack: input.designJsonBySide.back,
      previewPngFront: input.previewPngBySide.front,
      previewPngBack: input.previewPngBySide.back,
      sessionId: input.sessionId || null,
      userId: input.userId || null,
      status: 'draft',
    },
  });
}

export async function getDesignDraft(draftId: string) {
  return prisma.designDraft.findUnique({
    where: { id: draftId },
  });
}

export async function updateDesignDraft(
  draftId: string,
  updates: Partial<DesignDraftInput & { artKeyData?: string; status?: string }>
) {
  return prisma.designDraft.update({
    where: { id: draftId },
    data: {
      ...(updates.designJsonBySide && {
        designJsonFront: updates.designJsonBySide.front,
        designJsonBack: updates.designJsonBySide.back,
      }),
      ...(updates.previewPngBySide && {
        previewPngFront: updates.previewPngBySide.front,
        previewPngBack: updates.previewPngBySide.back,
      }),
      ...(updates.printSpecId && { printSpecId: updates.printSpecId }),
      ...(updates.dpi && { dpi: updates.dpi }),
      ...(updates.cornerStyle && { cornerStyle: updates.cornerStyle }),
      ...(updates.cornerRadiusMm !== undefined && { cornerRadiusMm: updates.cornerRadiusMm }),
      ...(updates.artKeyData && { artKeyData: typeof updates.artKeyData === 'string' ? updates.artKeyData : JSON.stringify(updates.artKeyData) }),
      ...(updates.status && { status: updates.status }),
      updatedAt: new Date(),
    },
  });
}
