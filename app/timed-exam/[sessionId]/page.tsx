import { ExamSession } from '@/components/timed-exam/ExamSession';

export default function ExamSessionPage({ params }: { params: { sessionId: string } }) {
  return <ExamSession sessionId={params.sessionId} />;
}
