import React, { useState } from 'react';

interface Item {
  id: number;
  name: string;
  category: string;
  isChecked: boolean;
}

const FilterComponent: React.FC = () => {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'Item 1', category: 'A', isChecked: false },
    { id: 2, name: 'Item 2', category: 'B', isChecked: false },
    // ...outros itens...
  ]);

  const [filters, setFilters] = useState<string[]>([]);

  const handleFilterChange = (category: string) => {
    setFilters((prevFilters) =>
      prevFilters.includes(category)
        ? prevFilters.filter((filter) => filter !== category)
        : [...prevFilters, category]
    );
  };

  const handleCheckChange = (id: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const filteredItems = items.filter((item) =>
    filters.length > 0 ? filters.includes(item.category) : true
  );

  return (
    <div>
      <div>
        <button onClick={() => handleFilterChange('A')}>Filter A</button>
        <button onClick={() => handleFilterChange('B')}>Filter B</button>
        {/* ...outros botões de filtro... */}
      </div>
      <ul>
        {filteredItems.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              checked={item.isChecked}
              onChange={() => handleCheckChange(item.id)}
            />
            {item.name} {item.isChecked && '(marked)'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FilterComponent;
