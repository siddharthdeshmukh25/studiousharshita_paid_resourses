import mongoose, { Model, Schema } from 'mongoose';

interface IResourceAnalytics {
  resourceId: mongoose.Types.ObjectId;
  visitorId?: mongoose.Types.ObjectId; // Optional - for logged-in visitors
  sessionId: string; // For tracking anonymous visitors
  eventType: 'page_view' | 'click' | 'purchase' | 'share' | 'time_on_page';
  trafficSource: 'direct' | 'shared_link' | 'internal_navigation' | 'social_media' | 'email' | 'search_engine' | 'other';
  referrer?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'other';
  browser?: string;
  os?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  socialPlatform?: 'instagram' | 'youtube' | 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'other';
  timeOnPage?: number; // in seconds
  conversionEvent?: boolean; // true if this led to a purchase
  metadata?: Record<string, any>;
  timestamp: Date;
}

const ResourceAnalyticsSchema = new Schema<IResourceAnalytics>({
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
  visitorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, required: true, index: true },
  eventType: { 
    type: String, 
    enum: ['page_view', 'click', 'purchase', 'share', 'time_on_page'],
    required: true,
    index: true
  },
  trafficSource: { 
    type: String, 
    enum: ['direct', 'shared_link', 'internal_navigation', 'social_media', 'email', 'search_engine', 'other'],
    required: true,
    index: true
  },
  referrer: { type: String, trim: true, maxlength: 500 },
  deviceType: { 
    type: String, 
    enum: ['mobile', 'tablet', 'desktop', 'other'],
    required: true,
    index: true
  },
  browser: { type: String, trim: true, maxlength: 50 },
  os: { type: String, trim: true, maxlength: 50 },
  location: {
    country: { type: String, trim: true, maxlength: 100 },
    city: { type: String, trim: true, maxlength: 100 },
    region: { type: String, trim: true, maxlength: 100 }
  },
  socialPlatform: { 
    type: String, 
    enum: ['instagram', 'youtube', 'twitter', 'facebook', 'linkedin', 'whatsapp', 'other'],
    index: true
  },
  timeOnPage: { type: Number, min: 0 },
  conversionEvent: { type: Boolean, default: false, index: true },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Compound indexes for efficient queries
ResourceAnalyticsSchema.index({ resourceId: 1, timestamp: -1 });
ResourceAnalyticsSchema.index({ sessionId: 1, timestamp: -1 });
ResourceAnalyticsSchema.index({ trafficSource: 1, timestamp: -1 });
ResourceAnalyticsSchema.index({ socialPlatform: 1, timestamp: -1 });

const ResourceAnalytics: Model<IResourceAnalytics> = mongoose.models.ResourceAnalytics || mongoose.model<IResourceAnalytics>('ResourceAnalytics', ResourceAnalyticsSchema);

export default ResourceAnalytics;
