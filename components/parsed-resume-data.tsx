"use client"

import { Progress } from "@/components/ui/progress"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Loader2 } from "lucide-react"
import { getUserActiveResume, getParsedContent } from "@/lib/db/resume-service"
import { useToast } from "@/hooks/use-toast"

interface ParsedResumeDataProps {
  userId?: string
}

export function ParsedResumeData({ userId = "550e8400-e29b-41d4-a716-446655440000" }: ParsedResumeDataProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumeData, setResumeData] = useState<any>(null)
  const [parsedContent, setParsedContent] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchResumeData() {
      try {
        setLoading(true)
        setError(null)

        // Get the user's active resume
        const activeResume = await getUserActiveResume(userId)

        if (!activeResume) {
          setLoading(false)
          return
        }

        setResumeData(activeResume)

        // Get the parsed content for the active resume
        const content = await getParsedContent(activeResume.id)

        if (content) {
          setParsedContent(content)
        }
      } catch (err) {
        console.error("Error fetching resume data:", err)
        setError("Failed to load resume data. Please try again.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load resume data. Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResumeData()
  }, [userId, toast])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parsed Resume Data</CardTitle>
          <CardDescription>Loading your resume information...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parsed Resume Data</CardTitle>
          <CardDescription>There was an error loading your resume</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-500">{error}</p>
          <Button className="mt-4 w-full" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!resumeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parsed Resume Data</CardTitle>
          <CardDescription>No resume found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            You haven't uploaded a resume yet. Please upload a resume to see parsed data.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!parsedContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parsed Resume Data</CardTitle>
          <CardDescription>Resume not yet parsed</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Your resume has been uploaded but not yet parsed. Please click "Parse Resume" on the uploader to extract
            information.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-medium">{resumeData.file_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Uploaded on {new Date(resumeData.upload_timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                Replace
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Extract data from parsed content
  const contactInfo = parsedContent.contact_info || {}
  const workExperience = parsedContent.work_experience || []
  const education = parsedContent.education || []
  const skills = parsedContent.skills || []
  const atsScore = parsedContent.ats_score || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parsed Resume Data</CardTitle>
        <CardDescription>Information extracted from your resume</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="document">Document</TabsTrigger>
          </TabsList>
          <TabsContent value="personal" className="mt-4 space-y-4">
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Name</h3>
              <p className="text-sm">{contactInfo.name || "Not available"}</p>
            </div>
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Email</h3>
              <p className="text-sm">{contactInfo.email || "Not available"}</p>
            </div>
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Phone</h3>
              <p className="text-sm">{contactInfo.phone || "Not available"}</p>
            </div>
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Location</h3>
              <p className="text-sm">{contactInfo.location || "Not available"}</p>
            </div>
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">LinkedIn</h3>
              <p className="text-sm">{contactInfo.linkedin || "Not available"}</p>
            </div>
            <Button className="mt-4">Edit Personal Information</Button>
          </TabsContent>
          <TabsContent value="experience" className="mt-4 space-y-4">
            {workExperience.length > 0 ? (
              workExperience.map((exp: any, index: number) => (
                <div key={index} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{exp.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {exp.company} • {exp.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {exp.startDate} - {exp.endDate}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                  <div className="mt-2">
                    {Array.isArray(exp.description) ? (
                      <ul className="list-disc pl-5 text-sm">
                        {exp.description.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No work experience found in your resume.</p>
            )}
            <Button>Add Experience</Button>
          </TabsContent>
          <TabsContent value="education" className="mt-4 space-y-4">
            {education.length > 0 ? (
              education.map((edu: any, index: number) => (
                <div key={index} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{edu.degree}</h3>
                      <p className="text-sm text-muted-foreground">
                        {edu.institution} • {edu.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {edu.startDate} - {edu.endDate}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No education information found in your resume.</p>
            )}
            <Button>Add Education</Button>
          </TabsContent>
          <TabsContent value="skills" className="mt-4">
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full p-0 hover:bg-muted">
                      <span className="sr-only">Remove {skill}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No skills found in your resume.</p>
            )}
            <div className="mt-4 rounded-lg border p-3">
              <h3 className="font-semibold">ATS Score</h3>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={atsScore} className="h-2 flex-1" />
                <span className="text-sm font-medium">{atsScore}%</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                This score indicates how well your resume is optimized for Applicant Tracking Systems.
              </p>
            </div>
            <Button className="mt-4">Add Skills</Button>
          </TabsContent>
          <TabsContent value="document" className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{resumeData.file_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Uploaded on {new Date(resumeData.upload_timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={resumeData.file_storage_path} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </Button>
                <Button variant="outline" size="sm">
                  Replace
                </Button>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Parsing History</h3>
              <div className="mt-2">
                <p className="text-sm">
                  <span className="font-medium">Parse Status:</span> {resumeData.parse_status}
                </p>
                {resumeData.parse_timestamp && (
                  <p className="text-sm">
                    <span className="font-medium">Last Parsed:</span>{" "}
                    {new Date(resumeData.parse_timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This is the original resume file you uploaded. You can download it or replace it with a new version.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
