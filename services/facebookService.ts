
import { Post } from '../types';

export const fetchFacebookPosts = async (pageId: string, accessToken: string): Promise<Post[]> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?fields=message,full_picture,created_time&limit=3&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch Facebook posts');
    }

    const data = await response.json();
    
    return data.data.map((fbPost: any) => ({
      id: `fb_${fbPost.id}`,
      title: 'Facebook Update',
      caption: fbPost.message || '',
      imageUrl: fbPost.full_picture || 'https://images.unsplash.com/photo-1513135243354-206219b15da3?q=80&w=800',
      timestamp: fbPost.created_time,
      visible: true
    }));
  } catch (error) {
    console.error('Facebook Fetch Error:', error);
    throw error;
  }
};
