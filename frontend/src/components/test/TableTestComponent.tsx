import React from 'react';
import MarkdownRenderer from '../common/MarkdownRenderer';

const TableTestComponent: React.FC = () => {
  const sampleTableMarkdown = `
# Table Rendering Test

Here's a sample table to test the markdown table rendering:

| Feature | Singly Linked List | Doubly Linked List |
|---------|-------------------|-------------------|
| Direction | Forward only | Forward and Backward |
| Memory Usage | Less | More |
| Deletion | More complex | Simpler |
| Traversal | Only forward | Both directions |

## Another Table

| Algorithm | Time Complexity | Space Complexity | Use Case |
|-----------|----------------|------------------|----------|
| Linear Search | O(n) | O(1) | Small datasets |
| Binary Search | O(log n) | O(1) | Sorted arrays |
| Hash Table | O(1) average | O(n) | Key-value lookups |
| Quick Sort | O(n log n) average | O(log n) | General sorting |

## Comparison Table

| Feature | Array | Doubly Linked List |
|---------|-------|-------------------|
| Memory | Contiguous | Non-contiguous |
| Insertion/Deletion | Slow (shifting) | Fast (pointer updates) |
| Size | Fixed (usually) | Dynamic |
| Random Access | O(1) | O(n) |

This should render as properly styled tables with theme-adaptive colors.
  `;

  return (
    <div className="p-6 bg-theme-secondary rounded-xl border border-theme max-w-4xl mx-auto">
      <MarkdownRenderer content={sampleTableMarkdown} />
    </div>
  );
};

export default TableTestComponent;
