/**
 * Job Application Tracking Service
 * Tracks user job applications and their statuses
 */
class ApplicationService {
  constructor() {
    // In-memory storage
    this.applications = new Map(); // applicationId -> application
    this.userApplications = new Map(); // userId -> Set of applicationIds
    this.applicationCounter = 1;
  }

  /**
   * Application statuses
   */
  static STATUS = {
    SAVED: 'saved',
    APPLIED: 'applied',
    INTERVIEWING: 'interviewing',
    OFFERED: 'offered',
    REJECTED: 'rejected',
    ACCEPTED: 'accepted',
    WITHDRAWN: 'withdrawn'
  };

  /**
   * Submit a new job application
   */
  applyToJob(userId, jobId, jobDetails = {}) {
    const applicationId = `APP-${this.applicationCounter++}`;
    
    const application = {
      id: applicationId,
      userId,
      jobId,
      jobTitle: jobDetails.title || 'Unknown',
      company: jobDetails.company || 'Unknown',
      location: jobDetails.location || {},
      status: ApplicationService.STATUS.APPLIED,
      appliedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      notes: '',
      timeline: [
        {
          status: ApplicationService.STATUS.APPLIED,
          date: new Date().toISOString(),
          note: 'Application submitted'
        }
      ]
    };
    
    // Store application
    this.applications.set(applicationId, application);
    
    // Add to user's applications
    if (!this.userApplications.has(userId)) {
      this.userApplications.set(userId, new Set());
    }
    this.userApplications.get(userId).add(applicationId);
    
    return {
      success: true,
      data: application,
      message: 'Application submitted successfully'
    };
  }

  /**
   * Update application status
   */
  updateStatus(userId, applicationId, newStatus, note = '') {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      return {
        success: false,
        message: 'Application not found'
      };
    }
    
    // Verify ownership
    if (application.userId !== userId) {
      return {
        success: false,
        message: 'Unauthorized'
      };
    }
    
    // Validate status
    if (!Object.values(ApplicationService.STATUS).includes(newStatus)) {
      return {
        success: false,
        message: 'Invalid status'
      };
    }
    
    // Update application
    application.status = newStatus;
    application.lastUpdated = new Date().toISOString();
    
    // Add to timeline
    application.timeline.push({
      status: newStatus,
      date: new Date().toISOString(),
      note: note || `Status changed to ${newStatus}`
    });
    
    return {
      success: true,
      data: application,
      message: 'Application status updated'
    };
  }

  /**
   * Add note to application
   */
  addNote(userId, applicationId, note) {
    const application = this.applications.get(applicationId);
    
    if (!application || application.userId !== userId) {
      return {
        success: false,
        message: 'Application not found'
      };
    }
    
    application.notes = note;
    application.lastUpdated = new Date().toISOString();
    
    return {
      success: true,
      data: application,
      message: 'Note added successfully'
    };
  }

  /**
   * Get all applications for a user
   */
  getUserApplications(userId, filters = {}) {
    if (!this.userApplications.has(userId)) {
      return {
        success: true,
        data: [],
        count: 0
      };
    }
    
    let applications = Array.from(this.userApplications.get(userId))
      .map(id => this.applications.get(id))
      .filter(app => app !== undefined);
    
    // Apply filters
    if (filters.status) {
      applications = applications.filter(app => app.status === filters.status);
    }
    
    if (filters.company) {
      applications = applications.filter(app => 
        app.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    
    // Sort by date (newest first)
    applications.sort((a, b) => 
      new Date(b.appliedDate) - new Date(a.appliedDate)
    );
    
    return {
      success: true,
      data: applications,
      count: applications.length
    };
  }

  /**
   * Get single application
   */
  getApplication(userId, applicationId) {
    const application = this.applications.get(applicationId);
    
    if (!application) {
      return {
        success: false,
        message: 'Application not found'
      };
    }
    
    if (application.userId !== userId) {
      return {
        success: false,
        message: 'Unauthorized'
      };
    }
    
    return {
      success: true,
      data: application
    };
  }

  /**
   * Delete application
   */
  deleteApplication(userId, applicationId) {
    const application = this.applications.get(applicationId);
    
    if (!application || application.userId !== userId) {
      return {
        success: false,
        message: 'Application not found'
      };
    }
    
    // Remove from maps
    this.applications.delete(applicationId);
    this.userApplications.get(userId).delete(applicationId);
    
    return {
      success: true,
      message: 'Application deleted'
    };
  }

  /**
   * Get application statistics for user
   */
  getUserStats(userId) {
    if (!this.userApplications.has(userId)) {
      return {
        total: 0,
        byStatus: {}
      };
    }
    
    const applications = Array.from(this.userApplications.get(userId))
      .map(id => this.applications.get(id));
    
    const byStatus = {};
    Object.values(ApplicationService.STATUS).forEach(status => {
      byStatus[status] = applications.filter(app => app.status === status).length;
    });
    
    return {
      total: applications.length,
      byStatus,
      recent: applications
        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        .slice(0, 5)
    };
  }

  /**
   * Check if user has already applied to a job
   */
  hasApplied(userId, jobId) {
    if (!this.userApplications.has(userId)) {
      return false;
    }
    
    const applications = Array.from(this.userApplications.get(userId))
      .map(id => this.applications.get(id));
    
    return applications.some(app => app.jobId === jobId);
  }

  /**
   * Get global statistics
   */
  getGlobalStats() {
    const byStatus = {};
    Object.values(ApplicationService.STATUS).forEach(status => {
      byStatus[status] = 0;
    });
    
    for (const application of this.applications.values()) {
      byStatus[application.status]++;
    }
    
    return {
      totalApplications: this.applications.size,
      totalUsers: this.userApplications.size,
      byStatus
    };
  }
}

module.exports = ApplicationService;
