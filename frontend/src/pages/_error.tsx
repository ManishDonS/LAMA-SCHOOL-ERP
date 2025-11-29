import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode?: number
}

export default function Error({ statusCode }: ErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          {statusCode ? statusCode : 'Error'}
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          {statusCode === 404
            ? 'Page Not Found'
            : statusCode === 500
            ? 'Internal Server Error'
            : 'An error occurred'}
        </p>
        <p className="text-gray-600 mb-8">
          {statusCode === 404
            ? 'The page you are looking for does not exist.'
            : 'Sorry, something went wrong. Please try again later.'}
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
