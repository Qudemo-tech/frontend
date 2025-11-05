import React, { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon, VideoCameraIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getVideoApiUrl } from '../config/api';

const FAQEditor = ({ qudemoId, companyName }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch FAQs on mount
  useEffect(() => {
    if (qudemoId && companyName) {
      fetchFAQs();
    }
  }, [qudemoId, companyName]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        getVideoApiUrl(`/faqs/${encodeURIComponent(companyName)}/${qudemoId}`)
      );
      const data = await response.json();
      
      if (data.success) {
        setFaqs(data.faqs || []);
      } else {
        showMessage('Failed to load FAQs', 'error');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      showMessage('Error loading FAQs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const startEdit = (faqId, field, currentValue) => {
    setEditingItem({ faqId, field });
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    const { faqId, field } = editingItem;

    try {
      setSaving(true);

      const endpoint = field === 'question' ? 'question' : 'answer';
      const payload = { [field]: editValue };

      const response = await fetch(
        getVideoApiUrl(`/faqs/${encodeURIComponent(companyName)}/${qudemoId}/${faqId}/${endpoint}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setFaqs(faqs.map(faq =>
          faq.id === faqId ? { ...faq, [field]: editValue } : faq
        ));

        if (field === 'answer' && data.video_regenerated) {
          showMessage('Answer saved! Video regeneration started (takes ~3-5 min)', 'success');
          
          // Refetch FAQs after a short delay to get the updated answer from server
          setTimeout(() => {
            fetchFAQs();
          }, 2000);
        } else {
          showMessage(`${field === 'question' ? 'Question' : 'Answer'} updated successfully`, 'success');
        }

        cancelEdit();
      } else {
        showMessage(data.error || 'Failed to save changes', 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showMessage('Error saving changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getFAQType = (faq) => {
    if (faq.is_intro) return { label: 'Intro Video', color: 'bg-purple-100 text-purple-800' };
    if (faq.is_fallback) {
      if (faq.question === 'NO_ANSWER_FOUND') return { label: 'No Answer Fallback', color: 'bg-yellow-100 text-yellow-800' };
      if (faq.question === 'SALES_INQUIRY') return { label: 'Sales Inquiry', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'Content FAQ', color: 'bg-blue-100 text-blue-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">FAQ Editor</h2>
            <p className="text-gray-600 mt-1">
              Edit questions and answers. Video regenerates automatically when answer is changed.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchFAQs}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
              title="Refresh FAQs"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">{faqs.length}</div>
              <div className="text-sm text-gray-600">Total FAQs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const faqType = getFAQType(faq);
          const isEditingQuestion = editingItem?.faqId === faq.id && editingItem?.field === 'question';
          const isEditingAnswer = editingItem?.faqId === faq.id && editingItem?.field === 'answer';

          return (
            <div key={faq.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${faqType.color}`}>
                        {faqType.label}
                      </span>
                    </div>
                  </div>
                  {faq.video_url && (
                    <div className="flex items-center space-x-2 text-green-600 text-sm">
                      <VideoCameraIcon className="w-5 h-5" />
                      <span>Video Ready</span>
                    </div>
                  )}
                  {faq.video_status === 'processing' && (
                    <div className="flex items-center space-x-2 text-yellow-600 text-sm">
                      <ClockIcon className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Question */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Question</h3>
                  {!isEditingQuestion && !isEditingAnswer && (
                    <button
                      onClick={() => startEdit(faq.id, 'question', faq.question)}
                      className="text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                      title="Edit question"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {isEditingQuestion ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter question..."
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={saveEdit}
                        disabled={saving || !editValue.trim()}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckIcon className="w-5 h-5" />
                        <span>{saving ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-900 text-lg text-left">{faq.question}</p>
                )}
              </div>

              {/* Answer */}
              <div className="p-6 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Answer</h3>
                  {!isEditingQuestion && !isEditingAnswer && (
                    <button
                      onClick={() => startEdit(faq.id, 'answer', faq.answer)}
                      className="text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                      title="Edit answer (will regenerate video)"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {isEditingAnswer ? (
                  <div className="space-y-3">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="6"
                      placeholder="Enter answer..."
                      maxLength={1000}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {editValue.length}/1000 characters
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving || !editValue.trim() || editValue.length > 1000}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <VideoCameraIcon className="w-5 h-5" />
                          <span>{saving ? 'Saving & Regenerating...' : 'Save & Regenerate Video'}</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      ⚠️ Changing the answer will regenerate the AI video (~3-5 minutes)
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap text-left">{faq.answer}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQEditor;

