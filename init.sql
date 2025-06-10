-- Create the applications table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    salary VARCHAR(255),
    requirements TEXT,
    url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'applied',
    notes TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50),
    file_type VARCHAR(100),
    minio_path TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the application_resumes junction table
CREATE TABLE IF NOT EXISTS application_resumes (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_resumes_is_default ON resumes(is_default);
CREATE INDEX IF NOT EXISTS idx_application_resumes_app_id ON application_resumes(application_id);
CREATE INDEX IF NOT EXISTS idx_application_resumes_resume_id ON application_resumes(resume_id);

-- Insert some sample data for testing (optional)
INSERT INTO applications (title, company, location, salary, requirements, url, status, notes) VALUES
('Software Engineer', 'Tech Corp', 'San Francisco, CA', '$120,000 - $150,000', 'React, Node.js, PostgreSQL experience required', 'https://example.com/job1', 'applied', 'Submitted application on company website'),
('Full Stack Developer', 'StartupXYZ', 'Remote', '$100,000 - $130,000', 'Python, Django, Vue.js preferred', 'https://example.com/job2', 'interview', 'Phone screen scheduled for next week')
ON CONFLICT DO NOTHING;