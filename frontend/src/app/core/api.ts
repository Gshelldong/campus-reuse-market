import { environment } from '../../environments/environment';

/** 后端返回的图片是相对路径（/uploads/xxx.png），拼接完整地址 */
export function imageUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }
  if (path.startsWith('http')) {
    return path;
  }
  return environment.apiUrl + path;
}

export const CONDITION_OPTIONS = [
  { value: 1, label: '全新' },
  { value: 2, label: '九成新' },
  { value: 3, label: '八成新' },
  { value: 4, label: '七成新' },
  { value: 5, label: '五成新及以下' },
];

export function conditionText(condition: number): string {
  return CONDITION_OPTIONS.find((c) => c.value === condition)?.label ?? '未知';
}

export const GOODS_STATUS = [
  { value: 0, label: '待审核', color: 'warn' },
  { value: 1, label: '上架中', color: 'primary' },
  { value: 2, label: '已售出', color: 'accent' },
  { value: 3, label: '已下架', color: '' },
] as const;

export function goodsStatusText(status: number): string {
  return GOODS_STATUS.find((s) => s.value === status)?.label ?? '未知';
}

export function goodsStatusColor(status: number): string {
  return GOODS_STATUS.find((s) => s.value === status)?.color ?? '';
}

export const ORDER_STATUS = [
  { value: 0, label: '待确认', color: 'accent' },
  { value: 1, label: '交易完成', color: 'primary' },
  { value: 2, label: '已取消', color: '' },
] as const;

export function orderStatusText(status: number): string {
  return ORDER_STATUS.find((s) => s.value === status)?.label ?? '未知';
}

export function orderStatusColor(status: number): string {
  return ORDER_STATUS.find((s) => s.value === status)?.color ?? '';
}
