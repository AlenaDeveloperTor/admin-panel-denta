'use client';

import { PageHeader } from '@/components/shared/page-header';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function NewsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Акции и новости" />
      <ComingSoon
        title="Модуль «Акции и новости»"
        description="Здесь будет CRUD для акций и новостей: дата публикации и окончания, тип (акция/новость), изображение для баннера и rich-text редактор. Пока не входит в текущий этап."
      />
    </div>
  );
}
