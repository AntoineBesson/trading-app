import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import contentService from '../services/contentService';

const styles = {
  page: { padding: '20px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '5px', maxWidth: '800px', margin: '20px auto' },
  title: { fontSize: '2em', marginBottom: '10px', color: '#333' },
  meta: { fontSize: '0.9em', color: '#777', marginBottom: '20px' },
  body: { lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#444' },
  videoContainer: {
    margin: '20px 0',
    position: 'relative',
    paddingBottom: '56.25%' /* 16:9 aspect ratio */,
    height: 0,
    overflow: 'hidden',
    maxWidth: '100%', // Ensure it's responsive
    background: '#000' // Black background for the container
  },
  videoIframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  error: { color: 'red' },
  loading: { fontStyle: 'italic' },
  backLink: { display: 'inline-block', marginTop: '20px', textDecoration: 'none', color: '#007bff' }
};

export default function ContentDetailPage() {
  const { contentId } = useParams(); // Get contentId from URL
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contentId) return;

    const fetchContentDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await contentService.getContentById(contentId);
        setContent(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch content details.');
      }
      setLoading(false);
    };

    fetchContentDetail();
  }, [contentId]);

  if (loading) return <p style={styles.loading}>Loading content details...</p>;
  if (error) return <p style={styles.error}>{error} <Link to="/content" style={styles.backLink}>Back to Content List</Link></p>;
  if (!content) return <p>Content not found. <Link to="/content" style={styles.backLink}>Back to Content List</Link></p>;

  const getYouTubeEmbedUrl = (url) => {
    // 1. Initial check for a valid URL input
    if (!url) {
      return null;
    }

    let videoId = null;

    try {
      const videoUrl = new URL(url);
      const hostname = videoUrl.hostname;

      // 2. Logic for standard youtube.com URLs (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
      if (hostname.includes('youtube.com')) {
        videoId = videoUrl.searchParams.get('v');
      }
      // 3. Logic for shortened youtu.be URLs (e.g., https://youtu.be/dQw4w9WgXcQ)
      else if (hostname.includes('youtu.be')) {
        // The video ID is in the pathname, remove the leading '/'
        videoId = videoUrl.pathname.substring(1);
      }

    } catch (e) {
      console.error("Error parsing the URL:", e);
      return null; // The URL was malformed
    }

    // 4. If a video ID was found, construct and return the standard embed URL
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // 5. If no valid ID was found, return null
    return null;
  };

  const embedUrl = content.content_type === 'video' ? getYouTubeEmbedUrl(content.video_url) : null;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>{content.title}</h1>
      <p style={styles.meta}>
        Type: {content.content_type} |
        Author: {content.author_username || 'N/A'} |
        Published: {content.created_at ? new Date(content.created_at).toLocaleDateString() : 'N/A'}
      </p>

      {content.content_type === 'video' && embedUrl && (
        <div style={styles.videoContainer}>
          <iframe
            src={embedUrl}
            title={content.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={styles.videoIframe}
          ></iframe>
        </div>
      )}
      {content.content_type === 'video' && content.video_url && !embedUrl && (
         <p>Watch video: <a href={content.video_url} target="_blank" rel="noopener noreferrer">{content.video_url}</a></p>
      )}

      {content.body && (
        <div style={styles.body}>
          <p>{content.body}</p>
        </div>
      )}
      <hr />
      <Link to="/content" style={styles.backLink}>Back to Content List</Link>
    </div>
  );
}
