import { TitleBar } from '@shopify/app-bridge-react'

export default function Page() {
  const buttons = {
    primaryAction: {
      content: 'Button 1',
      onAction: () => {
        console.log('button 1 clicked')
      },
    },
    secondaryActions: [
      {
        content: 'Button 2',
        onAction: () => {
          console.log('button 2 clicked')
        },
      },
    ],
  }

  return <TitleBar title="Test" {...buttons} />
}
