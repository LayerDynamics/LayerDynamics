import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import introData from './Intro.json';

const IntroContainer: React.FC = () => {
  return (
    <section className="container mx-auto py-12 px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-8"
      >
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary mb-4">
            {introData.title}
          </h1>
          <Badge variant="outline" className="text-sm md:text-base">
            {introData.openForWork}
          </Badge>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6 md:p-8">
            <p className="text-lg md:text-xl text-card-foreground leading-relaxed">
              {introData.whoiam}
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button variant="default" size="lg">
            <span className="mr-2">View Projects</span>
            <span className="i-lucide-arrow-right" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="lg">
            <span className="mr-2">Contact Me</span>
            <span className="i-lucide-mail" aria-hidden="true" />
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default IntroContainer;
