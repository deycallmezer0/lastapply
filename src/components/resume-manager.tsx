'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Download, FileText, Star, Trash2 } from 'lucide-react';
import { Resume } from '@/lib/db/schema';

interface ResumeManagerProps {
  selectedResumeId?: number;
  onResumeSelect?: (resumeId: number) => void;
  showSelection?: boolean;
}

export default function ResumeManager({ 
  selectedResumeId, 
  onResumeSelect, 
  showSelection = false 
}: ResumeManagerProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      const data = await response.json();
      if (response.ok) {
        setResumes(data.resumes);
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResumeName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', resumeName);
      formData.append('isDefault', isDefault.toString());

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload resume');
      }

      alert('Resume uploaded successfully!');
      setSelectedFile(null);
      setResumeName('');
      setIsDefault(false);
      fetchResumes();
    } catch (err) {
      alert('Failed to upload resume: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resumeId: number) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/download`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = ''; // Filename will be set by server
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download resume');
    }
  };

  const formatFileSize = (sizeString: string) => {
    return sizeString || 'Unknown size';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word')) return '📝';
    return '📄';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Resume
          </CardTitle>
          <CardDescription>
            Upload your resume in PDF or Word format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-file">Resume File</Label>
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
          </div>

          {selectedFile && (
            <>
              <div className="space-y-2">
                <Label htmlFor="resume-name">Resume Name</Label>
                <Input
                  id="resume-name"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  placeholder="e.g., Software Engineer Resume"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is-default">Set as default resume</Label>
              </div>

              <Button onClick={handleUpload} disabled={uploading || !resumeName}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resume
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Resume List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
          <CardDescription>
            {resumes.length} resume{resumes.length !== 1 ? 's' : ''} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resumes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No resumes uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    showSelection && selectedResumeId === resume.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(resume.fileType || '')}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{resume.name}</h3>
                          {resume.isDefault && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {resume.fileName} • {formatFileSize(resume.fileSize || '')}
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded {new Date(resume.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {showSelection && (
                        <Button
                          variant={selectedResumeId === resume.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => onResumeSelect?.(resume.id)}
                        >
                          {selectedResumeId === resume.id ? 'Selected' : 'Select'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(resume.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}