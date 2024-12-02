import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudySetsPage.css'; // Ensure this line is correctly importing your CSS file

const fetchStudySetsFromAPI = async (userId, setStudySets) => {
  try {
    const response = await fetch(`http://localhost:5001/api/study-sets?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      console.log('New Study Set:', data);
      setStudySets(data);
    } else {
      console.error('Failed to fetch study sets.');
    }
  } catch (error) {
    console.error('Error fetching study sets:', error);
  }
};

const StudySetsPage = () => {
  const [studySets, setStudySets] = useState([]);
  const [newStudySetName, setNewStudySetName] = useState('');
  const [newStudySetDescription, setNewStudySetDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchStudySetsFromAPI(userId, setStudySets);
    } else {
      console.error('User not logged in. Cannot fetch study sets.');
    }
  }, [userId]);

  const toggleModal = useCallback(() => {
    setIsModalOpen((prevState) => !prevState);
  }, []);

  const handleCreateStudySet = async () => {
    if (newStudySetName.trim() === '') {
      alert('Please provide a name for the new study set.');
      return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('name', newStudySetName);
    formData.append(
      'description',
      newStudySetDescription.trim() === '' ? null : newStudySetDescription
    );

    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:5001/api/study-set', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newStudySet = await response.json();
        console.log('New Study Set:', newStudySet);

        setStudySets((prevStudySets) => {
          const updatedStudySets = [...prevStudySets, newStudySet];
          console.log('Updated Study Set List:', updatedStudySets); // Log here
          return updatedStudySets;
        });

        setNewStudySetName('');
        setNewStudySetDescription('');
        setFiles([]);
        toggleModal();
      } else {
        alert('Failed to create study set. Please try again.');
      }
    } catch (error) {
      console.error('Error creating study set:', error);
    }
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const handleStudySetClick = (studySetId) => {
    navigate(`/study-sets/${studySetId}`);
  };

  return (
    <div className="study-sets-page">
      <h1>Study Sets</h1>

      <button onClick={toggleModal} className="create-study-set-button">
        Create New Study Set
      </button>

      <div className="study-sets-list">
        {studySets.length === 0 ? (
          <p>No study sets exist for your account. Start by creating a new study set!</p>
        ) : (
          <ul>
            {studySets.map((studySet) => (
              <li
                key={studySet.id || studySet.name}
                className="study-set-item"
                onClick={() => handleStudySetClick(studySet.id)}
              >
                <h3>{studySet.name}</h3>
                <p>{studySet.description || 'No description available'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Study Set</h2>
            <input
              type="text"
              placeholder="Study Set Name"
              value={newStudySetName}
              onChange={(e) => setNewStudySetName(e.target.value)}
              className="input-field"
            />
            <textarea
              placeholder="Study Set Description (optional)"
              value={newStudySetDescription}
              onChange={(e) => setNewStudySetDescription(e.target.value)}
              className="input-field"
            ></textarea>

            <div className="file-upload">
              <label htmlFor="file-upload" className="custom-file-upload">
                Choose Files
              </label>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                multiple
                className="input-field file-input"
                accept=".txt,.doc,.docx,.ppt,.pptx"
              />
              {files.length > 0 && (
                <div className="file-list">
                  <h4>Uploaded Files:</h4>
                  <ul>
                    {files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="file-types-info">
                Accepted file types: .txt, .doc, .docx, .ppt, .pptx
              </p>
            </div>

            <div className="modal-actions">
              <button onClick={toggleModal} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleCreateStudySet} className="confirm-button">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySetsPage;
