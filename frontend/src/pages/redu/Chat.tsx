import type { FC } from 'react';
import { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sources?: Array<{
    title: string;
    url: string;
  }>;
  isUser: boolean;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'} mb-6`}>
      {/* Message Bubble */}
      <div className="max-w-[80%]">
        <Card 
          className={`p-4 ${
            message.isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </Card>
      </div>

      {/* Sources Card */}
      {!message.isUser && message.sources && message.sources.length > 0 && (
        <div className="max-w-[70%] mt-2">
          <Card className="p-3 bg-background border border-border/50 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-1 h-1 rounded-full bg-primary"></div>
              <p className="text-xs font-medium text-muted-foreground">Sources</p>
            </div>
            <ul className="space-y-1.5">
              {message.sources.map((source, index) => (
                <li key={index} className="text-xs flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                  <a 
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary/80 hover:text-primary transition-colors"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};

const Chat: FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      isUser: false,
    },
    {
      id: '2',
      content: 'Here\'s an example response with sources.',
      sources: [
        {
          title: 'Research Paper: AI in Education',
          url: 'https://example.com/paper1',
        },
        {
          title: 'Latest Findings in ML',
          url: 'https://example.com/paper2',
        },
      ],
      isUser: false,
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: input,
      isUser: true,
    }]);

    // Simulate response (you'll replace this with actual API call)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: 'This is a simulated response with example sources.',
        sources: [
          {
            title: 'Documentation',
            url: 'https://example.com/docs',
          },
        ],
        isUser: false,
      }]);
    }, 1000);

    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="min-h-[calc(100vh-6rem)] flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Chat Assistant</h2>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" type="always">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t fixed bottom-0 left-0 right-10 bg-background">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
