// components/KnowledgeGapForm.js
import React, { useState } from 'react';
import axios from 'axios';

const KnowledgeGapForm = () => {
  const [content, setContent] = useState('');
  const [knowledgeGap, setKnowledgeGap] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/study/gap', { content });
      setKnowledgeGap(response.data.knowledgeGap);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Identify Knowledge Gap</h2>
      <form onSubmit={handleSubmit}>
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder="Enter class material"
        />
        <button type="submit">Identify Gap</button>
      </form>
      {knowledgeGap && <div><h3>Knowledge Gap:</h3><p>{knowledgeGap}</p></div>}
    </div>
  );
};

export default KnowledgeGapForm;
