import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import contentService from '../services/contentService';

// Basic inline styles for demonstration
const styles = {
  page: { padding: '20px' },
  list: { listStyle: 'none', padding: 0 },
  listItem: {
    border: '1px solid #ddd',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '5px',
    backgroundColor: '#fff'
  },
  link: { textDecoration: 'none', color: '#007bff', fontWeight: 'bold' },
  contentType: { fontSize: '0.9em', color: '#555', marginTop: '5px' },
  error: { color: 'red' },
  loading: { fontStyle: 'italic' },
  pagination: { marginTop: '20px', textAlign: 'center' },
  pageButton: { margin: '0 5px', padding: '5px 10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '3px' },
  disabledButton: { margin: '0 5px', padding: '5px 10px', backgroundColor: '#eee', color: '#aaa', border: '1px solid #ddd', borderRadius: '3px' }
};

export default function ContentListPage() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10; // Or get from API if configurable

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await contentService.getAllContent(currentPage, itemsPerPage);
        setContents(response.data.contents || []); // Ensure contents is always an array
        setTotalPages(response.data.pages || 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch content.');
        setContents([]); // Clear contents on error
        setTotalPages(0); // Reset total pages on error
      }
      setLoading(false);
    };

    fetchContent();
  }, [currentPage]); // Refetch when currentPage changes

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) return <p style={styles.loading}>Loading content...</p>;
  if (error) return <p style={styles.error}>{error}</p>;

  return (
    <div style={styles.page}>
      <h1>Educational Content</h1>
      {contents.length === 0 ? (
        <p>No content available at the moment.</p>
      ) : (
        <ul style={styles.list}>
          {contents.map((content) => (
            <li key={content.id} style={styles.listItem}>
              {/* Corrected Link syntax here */}
              <Link to={`/content/${content.id}`} style={styles.link}>
                {content.title}
              </Link>
              <p style={styles.contentType}>Type: {content.content_type}</p>
              {content.author_username && <p style={{fontSize: '0.8em', color: '#777'}}>By: {content.author_username}</p>}
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={currentPage === 1 ? styles.disabledButton : styles.pageButton}
          >
            Previous
          </button>
          <span> Page {currentPage} of {totalPages} </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={currentPage === totalPages ? styles.disabledButton : styles.pageButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
