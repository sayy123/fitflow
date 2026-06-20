import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from './card'

describe('Card', () => {
  it('renders the complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card Description')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('applies custom classNames to all subcomponents', () => {
    const { container } = render(
      <Card className="card-class">
        <CardHeader className="header-class">
          <CardTitle className="title-class">Title</CardTitle>
          <CardDescription className="description-class">Description</CardDescription>
          <CardAction className="action-class">Action</CardAction>
        </CardHeader>
        <CardContent className="content-class">Content</CardContent>
        <CardFooter className="footer-class">Footer</CardFooter>
      </Card>
    )

    expect(container.firstChild).toHaveClass('card-class')
    expect(screen.getByText('Title')).toHaveClass('title-class')
    expect(screen.getByText('Description')).toHaveClass('description-class')
    expect(screen.getByText('Action')).toHaveClass('action-class')
    expect(screen.getByText('Content')).toHaveClass('content-class')
    expect(screen.getByText('Footer')).toHaveClass('footer-class')
  })
})
