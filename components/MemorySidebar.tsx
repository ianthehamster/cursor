import { useEffect, useState } from 'react';
import axios from 'axios';

interface Props {
  character: 'jinx' | 'mf';
}

export default function MemorySidebar({ character }: Props) {
  const [memories, setMemories] = useState<string[]>([]);

  useEffect(() => {
    const fetchMemories = async () => {
      const res = await axios.get(`/api/chat?character=${character}`);
      setMemories(res.data.memories || []);
    };
    fetchMemories();
  }, [character]);

  return (
    <div>
      <h3 className="font-bold mb-2">
        {character === 'jinx' ? 'Jinx' : 'Miss Fortune'}'s Memory
      </h3>
      <ul className="text-sm space-y-1">
        {memories.map((mem, i) => (
          <li key={i}>• {mem}</li>
        ))}
      </ul>
    </div>
  );
}
