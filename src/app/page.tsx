'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, Building, MapPin, DollarSign, FileText, Calendar, Eye, Upload } from 'lucide-react';
import { Application } from '@/lib/db/schema';
import ResumeManager from '@/components/resume-manager';

// Update the JobInfo interface
interface JobInfo {
  title: string;
  company: string;
  pay: string;
  location: string;
  requirements: string;
  description?: string;
  benefits?: string;
  experience_level?: string;
  employment_type?: string;
  skills?: string[];
  responsibilities?: string[]; // Add this
}

interface JobInfoResponse {
  jobInfo: JobInfo;
  aiEnhanced?: boolean;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [currentView, setCurrentView] = useState<'add' | 'applications' | 'resumes'>('add');
  const [aiEnhanced, setAiEnhanced] = useState(false);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      if (response.ok) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setJobInfo(null);
  
    try {
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
  
      const data: JobInfoResponse = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape job information');
      }
  
      setJobInfo(data.jobInfo);
      setAiEnhanced(data.aiEnhanced || false); // Add this state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const saveApplication = async () => {
    if (!jobInfo) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: jobInfo.title,
          company: jobInfo.company,
          location: jobInfo.location,
          salary: jobInfo.pay,
          requirements: jobInfo.requirements,
          url: url,
          status: 'applied',
          notes: jobInfo.benefits ? `Benefits: ${jobInfo.benefits}` : undefined,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save application');
      }
  
      alert('Application saved successfully!');
      setJobInfo(null);
      setUrl('');
      setAiEnhanced(false);
      fetchApplications();
    } catch (err) {
      alert('Failed to save application: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'offer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <h1 className="text-4xl font-bold text-gray-900">Last Apply</h1>
          <p className="text-lg text-gray-600">Track your job applications with ease</p>
          <div className="flex justify-center gap-4 mt-4">
            <Button 
              variant={currentView === 'add' ? "default" : "outline"}
              onClick={() => setCurrentView('add')}
            >
              Add Application
            </Button>
            <Button 
              variant={currentView === 'applications' ? "default" : "outline"}
              onClick={() => setCurrentView('applications')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Applications ({applications.length})
            </Button>
            <Button 
              variant={currentView === 'resumes' ? "default" : "outline"}
              onClick={() => setCurrentView('resumes')}
            >
              <Upload className="mr-2 h-4 w-4" />
              Resumes
            </Button>
          </div>
        </div>

        {/* Content based on current view */}
        {currentView === 'add' && (
          <>
            {/* URL Input Form */}
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Add Job Application
                </CardTitle>
                <CardDescription>
                  Paste a LinkedIn job URL to automatically extract job details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">LinkedIn Job URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting job info...
                      </>
                    ) : (
                      'Extract Job Information'
                    )}
                  </Button>
                </form>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Information Display */}
{jobInfo && (
  <Card className="w-full max-w-4xl mx-auto">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          Job Information
          {aiEnhanced && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              ✨ AI Enhanced
            </span>
          )}
        </span>
        <Button onClick={saveApplication} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Application'
          )}
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Job Title
          </Label>
          <p className="text-lg font-semibold">{jobInfo.title}</p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Building className="h-4 w-4" />
            Company
          </Label>
          <p className="text-lg">{jobInfo.company}</p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            Location
          </Label>
          <p>{jobInfo.location}</p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4" />
            Salary
          </Label>
          <p>{jobInfo.pay}</p>
        </div>

        {/* Add Experience Level if available */}
        {jobInfo.experience_level && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Experience Level</Label>
            <p className="capitalize">{jobInfo.experience_level}</p>
          </div>
        )}

        {/* Add Employment Type if available */}
        {jobInfo.employment_type && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Employment Type</Label>
            <p className="capitalize">{jobInfo.employment_type}</p>
          </div>
        )}
      </div>

      {/* Add Skills section if available */}
      {jobInfo.skills && jobInfo.skills.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Key Skills</Label>
          <div className="flex flex-wrap gap-2">
            {jobInfo.skills.map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Benefits section if available */}
      {jobInfo.benefits && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Benefits</Label>
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-gray-700">{jobInfo.benefits}</p>
          </div>
        </div>
      )}

      {/* Add Description section if available and different from requirements */}
      {jobInfo.description && jobInfo.description !== jobInfo.requirements && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Job Description</Label>
          <div className="bg-blue-50 p-3 rounded-md max-h-48 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {jobInfo.description.length > 400 
                ? `${jobInfo.description.substring(0, 400)}...` 
                : jobInfo.description
              }
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          Job Requirements
        </Label>
        <div className="bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {jobInfo.requirements.length > 500 
              ? `${jobInfo.requirements.substring(0, 500)}...` 
              : jobInfo.requirements
            }
          </p>
        </div>
      </div>

      {/* Add Responsibilities section if available */}
{jobInfo.responsibilities && Array.isArray(jobInfo.responsibilities) && (
  <div className="space-y-2">
    <Label className="text-sm font-medium">Key Responsibilities</Label>
    <div className="bg-purple-50 p-3 rounded-md">
      <ul className="text-sm text-gray-700 space-y-1">
        {jobInfo.responsibilities.map((responsibility, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>{responsibility}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}
    </CardContent>
  </Card>
)}
          </>
        )}

        {currentView === 'resumes' && (
          <div className="max-w-4xl mx-auto">
            <ResumeManager />
          </div>
        )}

        {currentView === 'applications' && (
          /* Applications List */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Applications</CardTitle>
                <CardDescription>
                {applications.length} application{applications.length !== 1 ? 's' : ''} tracked
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-gray-500 mb-4">Start by adding your first job application</p>
                    <Button onClick={() => setCurrentView('add')}>
                      Add Your First Application
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {applications.map((app) => (
                      <div key={app.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{app.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {app.company}
                              </span>
                              {app.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {app.location}
                                </span>
                              )}
                              {app.salary && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {app.salary}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status || 'applied')}`}>
                              {app.status || 'applied'}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(app.appliedAt?.toString() || app.createdAt?.toString() || '')}
                            </span>
                          </div>
                        </div>
                        
                        {app.requirements && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements:</h4>
                            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md line-clamp-3">
                              {app.requirements.length > 200 
                                ? `${app.requirements.substring(0, 200)}...` 
                                : app.requirements
                              }
                            </p>
                          </div>
                        )}
                        
                        {app.notes && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Notes:</h4>
                            <p className="text-xs text-gray-600 bg-blue-50 p-3 rounded-md">
                              {app.notes}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-4 border-t">
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            View Job Posting
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <div className="text-xs text-gray-500">
                            Added {formatDate(app.createdAt?.toString() || '')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}