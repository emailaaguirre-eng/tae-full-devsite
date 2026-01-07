import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type DesignDraftInput = {
  productId?: string;
  variantId?: string;
  printSpecId: string;
  dpi?: number;
  cornerStyle?: 'square' | 'rounded';
  cornerRadiusMm?: number;
  designJsonFront?: string | null;
  designJsonBack?: string | null;
  previewPngFront?: string | null;
  previewPngBack?: string | null;
  usedAssetIds?: string | null;
  premiumFees?: number;
  // Legacy format support
  designJsonBySide?: {
    front: string | null;
    back: string | null;
  };
  previewPngBySide?: {
    front: string | null;
    back: string | null;
  };
  sessionId?: string;
  userId?: string;
};

export async function createDesignDraft(input: DesignDraftInput) {
  // Support both new format (direct fields) and legacy format (nested objects)
  const designJsonFront = input.designJsonFront ?? input.designJsonBySide?.front ?? null;
  const designJsonBack = input.designJsonBack ?? input.designJsonBySide?.back ?? null;
  const previewPngFront = input.previewPngFront ?? input.previewPngBySide?.front ?? null;
  const previewPngBack = input.previewPngBack ?? input.previewPngBySide?.back ?? null;
  
  return prisma.designDraft.create({
    data: {
      productId: input.productId || null,
      variantId: input.variantId || null,
      printSpecId: input.printSpecId,
      dpi: input.dpi || 300,
      cornerStyle: input.cornerStyle || 'square',
      cornerRadiusMm: input.cornerRadiusMm || 0,
      designJsonFront,
      designJsonBack,
      previewPngFront,
      previewPngBack,
      usedAssetIds: input.usedAssetIds || null,
      premiumFees: input.premiumFees || 0,
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
