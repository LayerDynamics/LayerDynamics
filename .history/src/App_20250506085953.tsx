import { useState } from 'react'
import Layout from './layout/layout'
import IntroContainer from './components/sections/Intro/IntroContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function App() {
  const [activeTab, setActiveTab] = useState("about")

  return (
    <Layout>
      <div className="flex flex-col min-h-screen">
        <IntroContainer />
        
        <section className="container mx-auto py-16 px-4 md:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-2">My Expertise</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Specialized skills in machine learning, web development, and software engineering
            </p>
          </div>
          
          <Tabs
            defaultValue="about"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full max-w-4xl mx-auto"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">About Me</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>About Me</CardTitle>
                  <CardDescription>Learn more about my background and journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      As a developer with a focus on machine learning and web development, I've dedicated 
                      my career to exploring the intersection of AI and user-facing applications.
                    </p>
                    <p>
                      My journey began with traditional web development, but quickly expanded into the realm 
                      of AI and machine learning as I recognized the transformative potential of these technologies.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">Read More</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="skills" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Technologies</CardTitle>
                  <CardDescription>The tools and technologies I work with</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <h3 className="font-medium">Python</h3>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <h3 className="font-medium">JavaScript/TypeScript</h3>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <h3 className="font-medium">Rust</h3>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <h3 className="font-medium">PyTorch</h3>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <h3 className="font-medium">FastAPI</h3>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <h3 className="font-medium">MERN Stack</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Featured Projects</CardTitle>
                  <CardDescription>Highlights from my portfolio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-medium mb-2">AI Text Generator</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        A machine learning model that generates human-like text based on input prompts.
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline">PyTorch</Badge>
                        <Badge variant="outline">Transformers</Badge>
                        <Badge variant="outline">FastAPI</Badge>
                      </div>
                    </div>
                    
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-medium mb-2">E-commerce Platform</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        A full-stack e-commerce solution with advanced search and recommendation features.
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="outline">React</Badge>
                        <Badge variant="outline">Node.js</Badge>
                        <Badge variant="outline">MongoDB</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>View All Projects</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Layout>
  )
}

export default App
