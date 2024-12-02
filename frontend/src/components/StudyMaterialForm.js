// components/StudyMaterialForm.js
import React, { useState } from 'react';
import axios from 'axios';

const StudyMaterialForm = () => {
  const [content, setContent] = useState('');
  const [studyMaterial, setStudyMaterial] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/study/generate', { content });
      setStudyMaterial(response.data.studyMaterial);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Generate Study Material</h2>
      <form onSubmit={handleSubmit}>
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder="Enter class material"
        />
        <button type="submit">Generate</button>
      </form>
      {studyMaterial && <div><h3>Generated Material:</h3><p>{studyMaterial}</p></div>}
    </div>
  );
};

export default StudyMaterialForm;
