/**
 * User Favorites/Saved Jobs Service
 * Allows users to bookmark jobs for later viewing
 */
class FavoritesService {
  constructor() {
    // In-memory storage: userId -> Set of jobIds
    this.favorites = new Map();
  }

  /**
   * Add job to favorites
   */
  addFavorite(userId, jobId) {
    if (!this.favorites.has(userId)) {
      this.favorites.set(userId, new Set());
    }
    
    this.favorites.get(userId).add(jobId);
    
    return {
      success: true,
      message: 'Job added to favorites',
      totalFavorites: this.favorites.get(userId).size
    };
  }

  /**
   * Remove job from favorites
   */
  removeFavorite(userId, jobId) {
    if (!this.favorites.has(userId)) {
      return {
        success: false,
        message: 'No favorites found for this user'
      };
    }
    
    const removed = this.favorites.get(userId).delete(jobId);
    
    return {
      success: removed,
      message: removed ? 'Job removed from favorites' : 'Job not in favorites',
      totalFavorites: this.favorites.get(userId).size
    };
  }

  /**
   * Get all favorite job IDs for a user
   */
  getFavoriteIds(userId) {
    if (!this.favorites.has(userId)) {
      return [];
    }
    
    return Array.from(this.favorites.get(userId));
  }

  /**
   * Get all favorite jobs with full details
   */
  getFavoriteJobs(userId, jobIngestionService) {
    const favoriteIds = this.getFavoriteIds(userId);
    
    if (favoriteIds.length === 0) {
      return {
        success: true,
        data: [],
        count: 0,
        message: 'No favorites yet'
      };
    }
    
    const jobs = favoriteIds
      .map(id => jobIngestionService.getJobById(id))
      .filter(job => job !== null);
    
    return {
      success: true,
      data: jobs,
      count: jobs.length
    };
  }

  /**
   * Check if a job is favorited by user
   */
  isFavorite(userId, jobId) {
    if (!this.favorites.has(userId)) {
      return false;
    }
    
    return this.favorites.get(userId).has(jobId);
  }

  /**
   * Get favorites count for a user
   */
  getFavoritesCount(userId) {
    if (!this.favorites.has(userId)) {
      return 0;
    }
    
    return this.favorites.get(userId).size;
  }

  /**
   * Clear all favorites for a user
   */
  clearFavorites(userId) {
    if (!this.favorites.has(userId)) {
      return {
        success: false,
        message: 'No favorites to clear'
      };
    }
    
    this.favorites.delete(userId);
    
    return {
      success: true,
      message: 'All favorites cleared'
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalUsers = this.favorites.size;
    let totalFavorites = 0;
    
    for (const favSet of this.favorites.values()) {
      totalFavorites += favSet.size;
    }
    
    return {
      totalUsers,
      totalFavorites,
      avgFavoritesPerUser: totalUsers > 0 ? (totalFavorites / totalUsers).toFixed(2) : 0
    };
  }
}

module.exports = FavoritesService;
