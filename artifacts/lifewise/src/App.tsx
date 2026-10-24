import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Practice from '@/pages/practice';
import SimulationPage from '@/pages/simulation';
import { LessonPage, DailyPage } from '@/pages/learn';
import { LearnHome, TrackPage } from '@/pages/learn-tracks';
import { ProgressPage } from '@/pages/progress';
import { Shell } from '@/components/shell';
import { LearnerProvider } from '@/hooks/use-learner';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={LearnHome} />
          <Route path="/practice" component={Practice} />
          <Route path="/learn" component={LearnHome} />
          <Route path="/learn/track/:subject" component={TrackPage} />
          <Route path="/learn/lesson/:id" component={LessonPage} />
          <Route path="/learn/daily" component={DailyPage} />
          <Route path="/learn/progress" component={ProgressPage} />
          <Route path="/simulation/:id" component={SimulationPage} />
          <Route path="/approvals"><Redirect to="/learn/progress" /></Route>
          <Route path="/observatory"><Redirect to="/learn/progress" /></Route>
          <Route path="/proof"><Redirect to="/" /></Route>
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <LearnerProvider>
            <Router />
          </LearnerProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
