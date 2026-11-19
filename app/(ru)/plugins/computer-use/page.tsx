import type { Metadata } from 'next';
import { computerUseMetadata, ComputerUsePage } from '../../../../src/views/computer-use.tsx';

export function generateMetadata(): Metadata {
  return computerUseMetadata('ru');
}

export default function Page() {
  return <ComputerUsePage locale="ru" />;
}
