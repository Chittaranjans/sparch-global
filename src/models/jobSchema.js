/**
 * Unified Job Schema
 * All jobs are normalized to this format
 */

class UnifiedJob {
  constructor({
    id,
    title,
    company,
    location,
    salary,
    description,
    postedDate,
    sourceId,
    originalId
  }) {
    this.id = id; // Unique internal ID
    this.title = title; // Normalized job title
    this.company = company; // Company name
    this.location = location; // Normalized location object
    this.salary = salary; // Normalized salary object
    this.description = description; // Job description
    this.postedDate = postedDate; // Date posted
    this.sourceId = sourceId; // Which source this came from
    this.originalId = originalId; // Original ID from source
  }
}

/**
 * Location Schema
 */
class Location {
  constructor({ city, state, country }) {
    this.city = city;
    this.state = state || '';
    this.country = country;
    this.normalized = this._normalize();
  }

  _normalize() {
    // Create a normalized string for comparison
    const parts = [this.city, this.state, this.country]
      .filter(p => p)
      .map(p => p.trim().toLowerCase());
    return parts.join(', ');
  }
}

/**
 * Salary Schema
 */
class Salary {
  constructor({ min, max, currency }) {
    this.min = min;
    this.max = max;
    this.currency = currency;
    this.formatted = this._format();
  }

  _format() {
    if (!this.min && !this.max) return 'Not specified';
    
    const format = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: this.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    if (this.min && this.max) {
      return `${format(this.min)} - ${format(this.max)}`;
    } else if (this.min) {
      return `From ${format(this.min)}`;
    } else {
      return `Up to ${format(this.max)}`;
    }
  }
}

module.exports = { UnifiedJob, Location, Salary };
