import { PracticeQuestion } from '@/components/practice/PracticeQuestion';

export default function PracticeQuestionPage({ params }: { params: { id: string } }) {
  return <PracticeQuestion id={params.id} />;
}
