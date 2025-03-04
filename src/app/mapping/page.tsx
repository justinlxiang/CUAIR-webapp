'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Header from '../components/Header'
import styles from '../styles/Home.module.css'
import { wsClient } from '../api/websocket'
import { Trash2 } from 'lucide-react'

export default function MappingPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [images, setImages] = useState<{
    image_url: string;
    image_id: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    altitude: number;
    yaw: number;
  }[]>([])
  const [selectedImageData, setSelectedImageData] = useState<typeof images[0] | null>(null)

  useEffect(() => {
    wsClient.connect();
    wsClient.onMessage((message) => {
      if (message.type === 'mapping_image') {
        setImages(prevImages => [...prevImages, message.data]);
      }
    });
    const savedState = localStorage.getItem('mappingState')
    if (savedState) {
      setIsRunning(JSON.parse(savedState))
    }

    fetchImages();
  },[])

  const fetchImages = async () => {
    try {
      const response = await fetch('http://localhost:8888/mapping/images')
      const data = await response.json()
      console.log(data)
      setImages(data.images)
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  const handleCommand = async (command: string) => {
    try {
      let endpoint = ''
      
      switch (command) {
        case 'start':
          endpoint = 'http://localhost:8888/mapping/start'
          break
        case 'stop':
          endpoint = 'http://localhost:8888/mapping/stop'
          break
        case 'generate':
          endpoint = 'http://localhost:8888/mapping/generate'
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (command === 'start' || command === 'stop') {
        const newState = command === 'start'
        setIsRunning(newState)
        localStorage.setItem('mappingState', JSON.stringify(newState))
      }
    } catch (error) {
      console.error('Error sending command:', error)
    }
  }

  const handleSelectImage = (image: typeof images[0]) => {
    const fullImageUrl = image.image_url.startsWith('http') 
      ? image.image_url 
      : `http://localhost:8888${image.image_url}`;
    
    setSelectedImage(fullImageUrl);
    setSelectedImageData(image);
  };

  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent image selection when clicking delete
    try {
      const response = await fetch(`http://localhost:8888/mapping/images/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove the deleted image from state
      setImages(prevImages => prevImages.filter(img => img.image_id !== imageId));
      if (selectedImageData?.image_id === imageId) {
        setSelectedImage(null);
        setSelectedImageData(null);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <>
      <Header />
      <main className={`bg-background ${styles.container}`}>
        <div className={styles.wrapper}>
          <h1 className={`text-foreground text-center ${styles.title}`}>Mapping</h1>

          <div className="flex justify-center mb-4">
            <div className="space-x-4">
              <Button
                onClick={() => handleCommand(isRunning ? 'stop' : 'start')}
                className={`font-semibold ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isRunning ? 'Stop' : 'Start'}
              </Button>
              <Button
                onClick={() => handleCommand('generate')}
                variant="default"
                className="font-semibold"
              >
                Generate
              </Button>
            </div>
          </div>

          <div className="flex gap-6">
            <Card className="w-64 bg-card border-border p-4 h-[calc(100vh-16rem)] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-1 text-card-foreground">Images</h2>
              <div className="h-0.5 bg-border mb-4"></div>
              <div className="space-y-2">
                {images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectImage(image)}
                    className={`p-2 rounded cursor-pointer hover:bg-accent ${
                      selectedImage === image.image_url ? 'bg-accent' : ''
                    } text-card-foreground flex justify-between items-center`}
                  >
                    <span>{image.image_id}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteImage(image.image_id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="flex-1 bg-card border-border p-4 h-[calc(100vh-16rem)]">
              {selectedImage ? (
                <div className="w-full h-full flex flex-col">
                  <div className="relative flex-1">
                    <Image
                      src={selectedImage}
                      alt="Selected Map"
                      fill
                      style={{ objectFit: 'contain' }}
                      unoptimized={true}
                    />
                  </div>
                  {selectedImageData && (
                    <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                      <h3 className="font-semibold mb-2">Image Metadata</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Timestamp:</span> {selectedImageData.timestamp}
                        </div>
                        <div>
                          <span className="font-medium">Latitude:</span> {selectedImageData.latitude.toFixed(6)}
                        </div>
                        <div>
                          <span className="font-medium">Longitude:</span> {selectedImageData.longitude.toFixed(6)}
                        </div>
                        <div>
                          <span className="font-medium">Altitude:</span> {selectedImageData.altitude.toFixed(2)}m
                        </div>
                        <div>
                          <span className="font-medium">Yaw:</span> {selectedImageData.yaw.toFixed(2)}°
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Select an image to view
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}