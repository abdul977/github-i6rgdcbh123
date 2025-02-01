import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Note, NoteEntry, ProcessingVariant } from '../types/note';
import { ReasoningResult } from '../services/ai-reasoning';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, Wand2 } from 'lucide-react';

const ProcessingVariantBadgeStyles = {
  [ProcessingVariant.ACTIONABLE]: 'bg-green-500 text-white',
  [ProcessingVariant.SUMMARY]: 'bg-blue-500 text-white',
  [ProcessingVariant.REASONING]: 'bg-purple-500 text-white',
  [ProcessingVariant.GRAMMAR]: 'bg-yellow-500 text-black'
};

const ProcessingVariantDescriptions = {
  [ProcessingVariant.ACTIONABLE]: 'Converts content into clear, actionable steps',
  [ProcessingVariant.SUMMARY]: 'Provides a concise overview of key points',
  [ProcessingVariant.REASONING]: 'Offers in-depth analysis and enhanced reasoning',
  [ProcessingVariant.GRAMMAR]: 'Improves text clarity and grammatical correctness'
};

const ReasoningResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { note, result } = location.state || {};

  if (!note || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">No Processing Results Found</h2>
          <p className="text-gray-600 mb-6">Please process a note first.</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notes
          </Button>
        </div>
      </div>
    );
  }

  const { processingType } = note;

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden transform transition-all hover:scale-[1.01]">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-extrabold 
              bg-clip-text text-transparent 
              bg-gradient-to-r from-purple-600 to-pink-600
              animate-gradient-x
            ">
              AI Processing Results
            </h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">Processing Variant:</span>
              <Badge 
                className={`
                  ${ProcessingVariantBadgeStyles[processingType]} 
                  px-4 py-2 rounded-full 
                  shadow-md 
                  transform transition-transform hover:scale-105
                `}
              >
                {processingType.toUpperCase()}
              </Badge>
            </div>
          </div>

          <section className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl shadow-inner">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 
              bg-clip-text text-transparent 
              bg-gradient-to-r from-purple-600 to-pink-600
            ">
              Processing Variant Details
            </h2>
            <p className="text-gray-700 italic flex items-center">
              <Wand2 className="inline-block mr-3 h-6 w-6 
                text-transparent bg-clip-text 
                bg-gradient-to-r from-purple-500 to-pink-500
                animate-pulse
              " />
              {ProcessingVariantDescriptions[processingType]}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-5 
              bg-clip-text text-transparent 
              bg-gradient-to-r from-blue-600 to-green-600
            ">
              Original Note
            </h2>
            <div className="bg-white p-6 border-2 border-gray-100 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-gray-700 mb-4 
                bg-clip-text text-transparent 
                bg-gradient-to-r from-blue-500 to-green-500
              ">
                {note.title}
              </h3>
              {note.entries.map((entry: NoteEntry, index: number) => (
                <div key={index} className="mb-5 pb-5 border-b last:border-b-0 hover:bg-gray-50 rounded-lg p-3 transition-colors">
                  {entry.content && (
                    <div className="mb-3">
                      <span className="font-semibold text-gray-600">Entry {index + 1}: </span>
                      <p className="text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  )}
                  {entry.audio_url && (
                    <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                      <span className="font-semibold text-gray-600 mb-2 block">Audio Attachment: </span>
                      <audio controls src={entry.audio_url} className="w-full mt-1 
                        bg-gradient-to-r from-blue-100 to-purple-100 
                        rounded-full
                      " />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-5 
              bg-clip-text text-transparent 
              bg-gradient-to-r from-blue-600 to-indigo-600
            ">
              AI-Generated Summary
            </h2>
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl border-l-4 border-blue-500 shadow-md">
              <p className="text-gray-700 italic text-lg">{result.summary}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-5 
              bg-clip-text text-transparent 
              bg-gradient-to-r from-green-600 to-teal-600
            ">
              Key Insights
            </h2>
            <ul className="space-y-4">
              {result.insights.map((insight: string, index: number) => (
                <li 
                  key={index} 
                  className="
                    bg-gradient-to-r from-green-50 to-teal-50 
                    p-4 rounded-xl 
                    border-l-4 border-green-500 
                    text-gray-700 
                    flex items-center 
                    shadow-md 
                    transform transition-transform hover:scale-[1.02]
                  "
                >
                  <svg className="w-6 h-6 mr-4 
                    text-transparent bg-clip-text 
                    bg-gradient-to-r from-green-500 to-teal-500
                  " fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {insight}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-5 
              bg-clip-text text-transparent 
              bg-gradient-to-r from-purple-600 to-indigo-600
            ">
              Processed Content
            </h2>
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6 rounded-xl shadow-inner">
              <p className="text-gray-700 whitespace-pre-wrap text-lg">{result.processedContent}</p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t-2 border-gray-100 flex justify-between items-center">
            <Button 
              variant="outline" 
              className="
                bg-gradient-to-r from-blue-50 to-green-50 
                hover:from-blue-100 hover:to-green-100 
                transform hover:scale-105 
                transition-all
              "
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-5 w-5 
                text-transparent bg-clip-text 
                bg-gradient-to-r from-blue-500 to-green-500
              " /> 
              Back to Notes
            </Button>
            <Button 
              onClick={() => window.print()}
              className="
                bg-gradient-to-r from-purple-500 to-pink-500 
                text-white 
                hover:from-purple-600 hover:to-pink-600 
                transform hover:scale-105 
                transition-all
              "
            >
              Print Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReasoningResults;