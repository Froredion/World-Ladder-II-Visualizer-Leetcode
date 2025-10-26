export interface WordLadderExample {
  name: string;
  begin: string;
  end: string;
  words: string[];
  description: string;
}

export const examples: WordLadderExample[] = [
  {
    name: "Classic (hit → cog)",
    begin: "hit",
    end: "cog",
    words: ["hot", "dot", "dog", "lot", "log", "cog"],
    description: "The classic LeetCode example with 2 shortest paths"
  },
  {
    name: "Simple (cat → dog)",
    begin: "cat",
    end: "dog",
    words: ["cat", "cot", "cog", "dog"],
    description: "A simple 3-step transformation"
  },
  {
    name: "Multiple Paths (red → hot)",
    begin: "red",
    end: "hot",
    words: ["red", "ted", "tex", "rex", "hex", "het", "hot", "rot", "tot"],
    description: "Multiple shortest paths of equal length"
  },
  {
    name: "Long Chain (cold → warm)",
    begin: "cold",
    end: "warm",
    words: ["cold", "cord", "card", "ward", "warm", "worm", "word", "lord"],
    description: "A longer transformation sequence"
  },
  {
    name: "No Solution (dog → cat)",
    begin: "dog",
    end: "cat",
    words: ["dog", "cot", "cat"],
    description: "Impossible transformation - no valid path"
  },
  {
    name: "Complex (team → mate)",
    begin: "team",
    end: "mate",
    words: ["team", "tear", "bear", "beat", "meat", "melt", "belt", "best", "beet", "meet", "mete", "mate"],
    description: "Complex graph with many intermediate words"
  }
];

