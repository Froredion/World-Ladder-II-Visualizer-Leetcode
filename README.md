# Word Ladder Visualizer

An interactive visualization tool for the classic Word Ladder problem, demonstrating how Breadth-First Search (BFS) finds all shortest transformation sequences between two words.

🔗 **Live Demo**: [https://froredion.github.io/World-Ladder-II-Visualizer-Leetcode/](https://froredion.github.io/World-Ladder-II-Visualizer-Leetcode/)

![Word Ladder Visualizer](https://img.shields.io/badge/React-18.3.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![Vite](https://img.shields.io/badge/Vite-5.0-purple) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-cyan)

## 🎯 Overview

The Word Ladder problem (LeetCode 126) asks: Given two words and a dictionary, find all shortest transformation sequences from the beginning word to the end word, where each intermediate word must be in the dictionary and differ by exactly one letter.

This visualizer shows step-by-step how layered BFS explores the word graph and how backtracking reconstructs all shortest paths.

## ✨ Features

- **Interactive Visualization**: Watch BFS expand level-by-level through the word graph
- **Playback Controls**: Play, pause, step forward/backward, and adjust animation speed
- **Multiple Examples**: Pre-loaded examples demonstrating various scenarios
- **Path Highlighting**: See all shortest paths highlighted once the target is found
- **Real-time Editing**: Modify begin word, end word, and word list on the fly
- **Detailed Insights**: View visited nodes, parent relationships, and frontier at each step

## 🎮 Usage

1. **Choose an Example**: Click on any pre-loaded example to see different word ladder scenarios
2. **Custom Input**: Enter your own begin word, end word, and word list
3. **Visualize**: Use playback controls to step through the BFS algorithm
4. **Analyze**: View the layered graph, visited nodes, and parent relationships

### Examples Included

- **Classic (hit → cog)**: The famous LeetCode example with 2 shortest paths
- **Simple (cat → dog)**: A straightforward 3-step transformation
- **Multiple Paths**: Demonstrates multiple equally-short solutions
- **Long Chain**: A longer transformation sequence
- **No Solution**: Shows what happens when no valid path exists
- **Complex Graph**: Many intermediate words with intricate connections

## 🛠️ Technical Details

### Algorithm

The visualizer implements a **layered BFS** approach:

1. Start from the begin word and explore neighbors level-by-level
2. Track parent relationships to enable path reconstruction
3. Stop when the target word is found at the current level
4. Backtrack through parents to enumerate all shortest paths

### Performance Optimization

- **Pattern Buckets**: Pre-computed neighbor lookup using wildcard patterns (e.g., `h*t`, `*it`)
- **O(26 × L × N)** neighbor finding where L is word length and N is dictionary size
- Efficient cycle prevention during backtracking

### Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **SVG** - Graph rendering

## 📁 Project Structure

```
word-ladder-visualizer/
├── src/
│   ├── App.tsx          # Main component with BFS logic
│   ├── examples.ts      # Pre-loaded example scenarios
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

## 🎨 Visualization Details

- **Columns**: Represent BFS levels (distance from begin word)
- **Edges**: Show parent-child relationships captured during BFS
- **Green Rings**: Highlight nodes that lie on at least one shortest path
- **Blue Border**: Marks the begin word
- **Bold Text**: Indicates the end word

## 🙏 Acknowledgments

Inspired by LeetCode Problem 126: Word Ladder II. This visualization helps understand the intricate details of layered BFS and backtracking for shortest path enumeration.
