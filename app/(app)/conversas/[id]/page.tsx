import ChatRoom from "@/app/components/ChatRoom";

export default function ConversaPage({ params }: { params: { id: string } }) {
  return <ChatRoom matchId={Number(params.id)} />;
}
